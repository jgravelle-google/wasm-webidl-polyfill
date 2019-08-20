#!/usr/bin/env python

import json
import os
import sys

INTERFACE_TYPES = {
  'Any': 0x00,
  'Int': 0x01,
  'Float': 0x02,
  'String': 0x03,
}
WASM_TYPES = {
  "i32": 0x7f,
  "i64": 0x7e,
  "f32": 0x7d,
  "f64": 0x7c,
  "anyref": 0x6f,
}

def leb_u32(value):
  assert value >= 0, "Unsigned LEBs must have signed value"
  leb = []
  while True:
    byte = value & 0x7f
    value >>= 7
    if value == 0:
      leb.append(byte)
      break
    else:
      leb.append(byte | 0x80)
  return leb

def binary_u32(value):
  binary = []
  for i in range(4):
    byte = value & 0xff
    value >>= 8
    binary.append(byte)
  return binary

def custom_section_binary(section_name, data):
  encoded_name = str_encode(section_name)
  binary_size = len(data) + len(encoded_name)
  size_leb = leb_u32(binary_size)

  return (
    [0] + # custom section
    size_leb + # payload_len
    encoded_name +
    data
  )

def parse_sexprs(text):
  stack = [[]]
  cur = ''
  def sep():
    if cur != '':
      stack[-1].append(cur)
    return ''
  i = 0
  while i < len(text):
    c = text[i]
    i += 1
    if c == '(':
      cur = sep()
      stack.append([])
    elif c == ')':
      cur = sep()
      top = stack[-1]
      stack = stack[0:-1]
      stack[-1].append(top)
    elif c.isspace():
      cur = sep()
    else:
      if c == ';' and i < len(text) and text[i] == ';':
        # Handle comments
        while i < len(text) and text[i] != '\n':
          i += 1
      else:
        cur += c
  return stack[0]

def str_encode(text):
  return leb_u32(len(text)) + [ord(c) for c in text]

def flatten(lst):
  return [item for sublist in lst for item in sublist]
def segment(part):
  return leb_u32(len(part)) + flatten(part)

def parse_interface(contents):
  # using ';; Interface' as a sentinel to avoid naively sexpr parsing all the .wat
  idl_section = contents.split(';; Interface\n')[1].strip()
  sexprs = parse_sexprs(idl_section)

  # Use export decls to avoid parsing the whole wat
  # Probably won't need this in the full version.
  export_decls = []
  for elem in sexprs:
    if elem[0] != '@interface' or elem[1] != 'export':
      continue
    name = elem[2][1:-1]
    params = []
    results = []
    for s in elem[3:]:
      if s[0] == 'param':
        for p in s[1:]:
          params.append([WASM_TYPES[p]])
      else:
        assert s[0] == 'result'
        for r in s[1:]:
          results.append([WASM_TYPES[r]])
    export_decls.append(
      str_encode(name) +
      segment(params) +
      segment(results)
    )

  # Imported function declarations
  import_funcs = []
  import_name_idx = {}
  for elem in sexprs:
    if elem[0] != '@interface' or elem[1] != 'func':
      continue
    if len(elem) < 4 or elem[3][0] != 'import':
      continue
    # store import declaration for use in instructions later
    # e.g. '$foo' => 2
    func_name = elem[2]
    import_name_idx[func_name] = len(import_funcs)

    namespace = elem[3][1][1:-1]
    name = elem[3][2][1:-1]
    params = []
    results = []
    for s in elem[4:]:
      if s[0] == 'param':
        for p in s[1:]:
          params.append([INTERFACE_TYPES[p]])
      else:
        assert s[0] == 'result'
        for r in s[1:]:
          results.append([INTERFACE_TYPES[r]])
    import_funcs.append(
      str_encode(namespace) +
      str_encode(name) +
      segment(params) +
      segment(results)
    )

  # Adapter function definitions
  adapters = []
  for elem in sexprs:
    if elem[0] != '@interface' or elem[1] != 'adapt':
      continue
    if elem[2][0] == 'import':
      namespace = elem[2][1][1:-1]
      name = elem[2][2][1:-1]
      # import == 0
      preamble = [0] + str_encode(namespace) + str_encode(name)
      types = WASM_TYPES
    else:
      assert elem[2][0] == 'export'
      name = elem[2][1][1:-1]
      # export == 1
      preamble = [1] + str_encode(name)
      types = INTERFACE_TYPES
    params = []
    results = []
    instrs = []

    class InstReader(object):
      def __init__(self, i):
        self.i = i

      def peek(self):
        return elem[self.i]
      def next(self):
        ret = self.peek()
        self.i += 1
        return ret
      def done(self):
        return self.i >= len(elem)

    reader = InstReader(i=3)
    # read params + results
    param_name_idx = {}
    while not reader.done():
      s = reader.peek()
      if s[0] == 'param':
        param_name = s[1]
        param_name_idx[param_name] = len(params)
        params.append([types[s[2]]])
      elif s[0] == 'result':
        for r in s[1:]:
          results.append([types[r]])
      else:
        # stop at instructions
        break
      reader.next()
    # read instructions
    while not reader.done():
      instr = reader.next()
      if instr == 'arg.get':
        arg = reader.next()
        assert arg in param_name_idx, (
          'Missing param ' + arg + ' in ' + str(param_name_idx)
        )
        idx = param_name_idx[arg]
        instrs.append([0x00, idx])
      elif instr == 'call':
        arg = reader.next()
        assert arg in import_name_idx, (
          'Missing import ' + arg + ' in ' + str(import_name_idx)
        )
        idx = import_name_idx[arg]
        instrs.append([0x01, idx])
      elif instr == 'call-export':
        arg = reader.next()
        instrs.append([0x02] + str_encode(arg[1:-1]))
      elif instr == 'read-utf8':
        instrs.append([0x03])
      elif instr == 'write-utf8':
        arg = reader.next()
        instrs.append([0x04] + str_encode(arg[1:-1]))
      elif instr == 'as-wasm':
        arg = reader.next()
        instrs.append([0x05, WASM_TYPES[arg]])
      elif instr == 'as-interface':
        arg = reader.next()
        instrs.append([0x06, INTERFACE_TYPES[arg]])
      elif instr == 'table-ref-add':
        instrs.append([0x07])
      elif instr == 'table-ref-get':
        instrs.append([0x08])
      elif instr == 'call-method':
        arg = reader.next()
        assert arg in import_name_idx, (
          'Missing import ' + arg + ' in ' + str(import_name_idx)
        )
        idx = import_name_idx[arg]
        instrs.append([0x09, idx])
      else:
        assert False, 'Unknown instr: ' + str(instr)
    adapters.append(
      preamble +
      segment(params) +
      segment(results) +
      segment(instrs)
    )

  # List of exports to re-export
  forwards = []
  for elem in sexprs:
    if elem[0] != '@interface' or elem[1] != 'forward':
      continue
    assert elem[2][0] == 'export'
    name = elem[2][1][1:-1]
    forwards.append(str_encode(name))

  return (
    segment(export_decls) +
    segment(import_funcs) +
    segment(adapters) +
    segment(forwards)
  )

def main(args):
  assert len(args) == 2, "Must have infile and outfile (in that order)"
  infile = args[0]
  outfile = args[1]
  contents = open(infile, 'r').read()
  data = parse_interface(contents)
  binary = custom_section_binary('webIDLBindings', data)
  with open(outfile, 'wb') as f:
    f.write(bytearray(binary))
  return 0

if __name__ == '__main__':
  sys.exit(main(sys.argv[1:]))
