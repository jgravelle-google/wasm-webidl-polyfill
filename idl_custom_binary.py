#!/usr/bin/env python

import json
import os
import sys

TYPES = {
  # Interface types
  'Int': 0x7fff,
  'Float': 0x7ffe,
  'Any': 0x7ffd,
  'String': 0x7ffc,
  'Seq': 0x7ffb,

  # Wasm types
  'i32': 0x7f,
  'i64': 0x7e,
  'f32': 0x7d,
  'f64': 0x7c,
  'anyref': 0x6f,
}

def leb_u32(value):
  assert value >= 0, "Unsigned LEBs must have positive value"
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

# Converts folded SExpressions into unfolded
#  e.g. (add (mul 3 4) (neg 2)) => (mul 3 4) (neg 2) add
def unfold(sexpr, top_level=True):
  if not isinstance(sexpr, list):
    return sexpr
  result = []
  prefix = []
  for elem in sexpr:
    if isinstance(elem, list):
      if top_level:
        result += unfold(elem, top_level=False)
      else:
        prefix += unfold(elem, top_level=False)
    else:
      result.append(elem)
  return prefix + result

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

  type_name_idx = {}
  def type_leb(ty):
    # Name -> type bytes
    if isinstance(ty, list):
      assert ty[0] == 'Seq'
      assert len(ty) == 2
      return leb_u32(TYPES[ty[0]]) + type_leb(ty[1])
    if ty in TYPES:
      return leb_u32(TYPES[ty])
    assert ty in type_name_idx
    return leb_u32(type_name_idx[ty])

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
          params.append(type_leb(p))
      else:
        assert s[0] == 'result'
        for r in s[1:]:
          results.append(type_leb(r))
    export_decls.append(
      str_encode(name) +
      segment(params) +
      segment(results)
    )

  # Type declarations
  type_decls = []
  type_decl_field_idx = [] # map from field names to field offsets
  for elem in sexprs:
    if elem[0] != '@interface' or elem[1] != 'type':
      continue
    name = elem[2]
    field_names = []
    field_types = []
    assert elem[3] == 'record'
    field_mapping = {}
    for field in elem[4:]:
      assert len(field) == 3
      assert field[0] == 'field'
      field_name = field[1]
      field_mapping[field_name] = len(field_names)
      # remove leading '$'
      field_names.append(str_encode(field_name[1:]))
      field_types.append(type_leb(field[2]))
    type_name_idx[name] = len(type_decls)
    type_decls.append(
      str_encode(name) +
      segment(field_names) +
      segment(field_types)
    )
    type_decl_field_idx.append(field_mapping)

  # Imported function declarations
  import_funcs = []
  next_callable_idx = 0
  callable_name_idx = {}
  for elem in sexprs:
    if elem[0] != '@interface' or elem[1] != 'func':
      continue
    if len(elem) < 4 or elem[3][0] != 'import':
      continue
    # store import declaration for use in instructions later
    # e.g. '$foo' => 2
    func_name = elem[2]
    callable_name_idx[func_name] = next_callable_idx
    next_callable_idx += 1

    namespace = elem[3][1][1:-1]
    name = elem[3][2][1:-1]
    params = []
    results = []
    for s in elem[4:]:
      if s[0] == 'param':
        for p in s[1:]:
          params.append(type_leb(p))
      else:
        assert s[0] == 'result'
        for r in s[1:]:
          results.append(type_leb(r))
    import_funcs.append(
      str_encode(namespace) +
      str_encode(name) +
      segment(params) +
      segment(results)
    )

  # Adapter function definitions
  adapters = []
  for elem in sexprs:
    if elem[0] != '@interface':
      continue
    if elem[1] == 'adapt' and elem[2][0] == 'import':
      namespace = elem[2][1][1:-1]
      name = elem[2][2][1:-1]
      # import == 0
      preamble = [0] + str_encode(namespace) + str_encode(name)
      read_idx = 3
    elif elem[1] == 'adapt' and elem[2][0] == 'export':
      name = elem[2][1][1:-1]
      # export == 1
      preamble = [1] + str_encode(name)
      read_idx = 3
    elif elem[1] == 'func' and elem[3][0] != 'import':
      func_name = elem[2]
      callable_name_idx[func_name] = next_callable_idx
      next_callable_idx += 1
      # helper func == 2
      preamble = [2] + str_encode(func_name)
      read_idx = 3
    else:
      continue
    params = []
    results = []
    instrs = []

    # read params + results
    param_name_idx = {}
    while read_idx < len(elem):
      s = elem[read_idx]
      if s[0] == 'param':
        param_name = s[1]
        param_name_idx[param_name] = len(params)
        params.append(type_leb(s[2]))
      elif s[0] == 'result':
        for r in s[1:]:
          results.append(type_leb(r))
      else:
        # stop at instructions
        break
      read_idx += 1

    # read instructions
    class InstReader(object):
      def __init__(self, elems):
        self.elems = unfold(elems)
        self.i = 0

      def peek(self):
        return self.elems[self.i]
      def next(self):
        ret = self.peek()
        self.i += 1
        return ret
      def done(self):
        return self.i >= len(self.elems)

    reader = InstReader(elem[read_idx:])
    while not reader.done():
      instr = reader.next()
      if instr == 'arg.get':
        arg = reader.next()
        assert arg in param_name_idx, (
          'Missing param ' + arg + ' in ' + str(param_name_idx)
        )
        idx = param_name_idx[arg]
        instrs.append([0x00] + leb_u32(idx))
      elif instr == 'call':
        arg = reader.next()
        assert arg in callable_name_idx, (
          'Missing function ' + arg + ' in ' + str(callable_name_idx)
        )
        idx = callable_name_idx[arg]
        instrs.append([0x01] + leb_u32(idx))
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
        instrs.append([0x05] + type_leb(arg))
      elif instr == 'as-interface':
        arg = reader.next()
        instrs.append([0x06] + type_leb(arg))
      elif instr == 'table-ref-add':
        instrs.append([0x07])
      elif instr == 'table-ref-get':
        instrs.append([0x08])
      elif instr == 'call-method':
        arg = reader.next()
        assert arg in callable_name_idx, (
          'Missing function ' + arg + ' in ' + str(callable_name_idx)
        )
        idx = callable_name_idx[arg]
        instrs.append([0x09] + leb_u32(idx))
      elif instr == 'make-record':
        arg = reader.next()
        assert arg in type_name_idx, (
          'Missing type ' + arg + ' in ' + str(type_name_idx)
        )
        idx = type_name_idx[arg]
        instrs.append([0x0a] + leb_u32(idx))
      elif instr == 'get-field':
        ty = reader.next()
        assert ty in type_name_idx, (
          'Missing type ' + ty + ' in ' + str(type_name_idx)
        )
        ty_idx = type_name_idx[ty]
        field = reader.next()
        field_map = type_decl_field_idx[ty_idx]
        assert field in field_map, (
          'Missing field ' + field + ' in ' + str(field_map)
        )
        field_idx = field_map[field]
        instrs.append([0x0c] + leb_u32(ty_idx) + leb_u32(field_idx))
      elif instr == 'const':
        ty = reader.next()
        assert ty == 'i32'
        val_str = reader.next()
        val = int(val_str)
        instrs.append([0x0d] + type_leb(ty) + leb_u32(val))
      elif instr == 'fold-seq':
        func = reader.next()
        assert func in callable_name_idx, (
          'Missing function ' + func + ' in ' + str(callable_name_idx)
        )
        idx = callable_name_idx[func]
        instrs.append([0x0e] + leb_u32(idx))
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
    segment(type_decls) +
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
  binary = custom_section_binary('interface-types', data)
  with open(outfile, 'wb') as f:
    f.write(bytearray(binary))
  return 0

if __name__ == '__main__':
  sys.exit(main(sys.argv[1:]))
