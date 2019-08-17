#!/usr/bin/env python

import json
import os
import sys

INTERFACE_TYPES = {
  'any': 0,
  'int': 1,
  'float': 2,
  'string': 3,
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

def parse_webidl(contents):
  # using ';; WebIDL' as a sentinel to avoid naively sexpr parsing all the .wat
  idl_section = contents.split(';; WebIDL')[1].strip()
  sexprs = parse_sexprs(idl_section)

  # parse types
  type_map = {}
  type_bytes = []
  for elem in sexprs:
    if elem[0] != '@webidl' or elem[1] != 'type':
      continue
    name = elem[2]
    assert name[0] == '$'
    index = len(type_map)
    type_map[name] = len(type_map)
    type_bytes.append([WEBIDL_TYPES[elem[3]]])

  # parse func bindings
  data = []
  for elem in sexprs:
    if elem[0] != '@webidl' or elem[1] != 'func-binding':
      continue
    if elem[2] == 'import':
      namespace = elem[3][1:-1]
      name = elem[4][1:-1]

      params = []
      results = []
      kind_str = elem[5]
      if kind_str == 'static':
        import_kind = [0]
      elif kind_str == 'method':
        import_kind = [1]
      else:
        assert False, 'unexpected kind: ' + str(kind_str)
      for x in elem[6:]:
        if x[0] == "param":
          for param in x[1:]:
            params.append(outgoingBytes(param, type_map))
        else:
          assert x[0] == "result"
          for result in x[1:]:
            results.append(incomingBytes(result))
      import_byte = 0
      data.append([import_byte] +
        str_encode(namespace) +
        str_encode(name) +
        import_kind +
        segment(params) +
        segment(results)
      )
    else:
      assert elem[2] == "export"
      name = elem[3][1:-1]

      params = []
      results = []
      for x in elem[4:]:
        if x[0] == "param":
          for param in x[1:]:
            params.append(incomingBytes(param))
        else:
          assert x[0] == "result"
          for result in x[1:]:
            results.append(outgoingBytes(result, type_map))
      export_byte = 1
      data.append([export_byte] +
        str_encode(name) +
        segment(params) +
        segment(results)
      )

  return segment(type_bytes) + segment(data)

def flatten(lst):
  return [item for sublist in lst for item in sublist]
def segment(part):
  return leb_u32(len(part)) + flatten(part)

def outgoingBytes(sexpr, type_map):
  head = sexpr[0]
  if head == 'as':
    assert sexpr[1][0] == 'webidl-type'
    assert sexpr[2][0] == 'idx'
    idByte = 0
    ty = type_map[sexpr[1][1]]
    off = int(sexpr[2][1])
    return [idByte, ty, off]
  elif head == 'utf8-cstr':
    assert sexpr[1][0] == 'type'
    assert sexpr[2][0] == 'off-idx'
    idByte = 1
    ty = type_map[sexpr[1][1]]
    off = int(sexpr[2][1])
    return [idByte, ty, off]
  elif head == 'lift-func-idx':
    assert sexpr[1][0] == 'type'
    assert sexpr[2][0] == 'table'
    assert sexpr[3][0] == 'idx'
    idByte = 2
    ty = type_map[sexpr[1][1]]
    tableName = sexpr[2][1][1:-1]
    off = int(sexpr[3][1])
    return [idByte, ty] + str_encode(tableName) + [off]
  assert False, 'Unknown outgoing: ' + str(sexpr)

def incomingBytes(sexpr):
  head = sexpr[0]
  if head == 'as':
    assert sexpr[1][0] == 'wasm-type'
    idByte = 0
    ty = WASM_TYPES[sexpr[1][1]]
    expr = inExpr(sexpr[2])
    return [idByte, ty] + expr
  elif head == 'alloc-utf8-cstr':
    assert sexpr[1][0] == 'alloc-export'
    idByte = 1
    name = sexpr[1][1][1:-1]
    expr = inExpr(sexpr[2])
    return [idByte] + str_encode(name) + expr
  elif head == 'lower-func-idx':
    assert sexpr[1][0] == 'table'
    idByte = 2
    tableName = sexpr[1][1][1:-1]
    expr = inExpr(sexpr[2])
    return [idByte] + str_encode(tableName) + expr
  assert False, 'Unknown incoming: ' + str(sexpr)
def inExpr(sexpr):
  head = sexpr[0]
  if head == 'get':
    idByte = 0
    off = int(sexpr[1])
    return [idByte, off]
  assert False, 'Unknown inExpr: ' + str(sexpr)

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

    i = 3
    # read params + results
    param_name_idx = {}
    while i < len(elem):
      s = elem[i]
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
      i += 1
    # read instructions
    def next():
      nonlocal i
      ret = elem[i]
      i += 1
      return ret
    while i < len(elem):
      instr = next()
      if instr == 'arg.get':
        arg = next()
        assert arg in param_name_idx, (
          'Missing param ' + arg + ' in ' + str(param_name_idx)
        )
        idx = param_name_idx[arg]
        instrs.append([0, idx])
      elif instr == 'call':
        arg = next()
        assert arg in import_name_idx, (
          'Missing import ' + arg + ' in ' + str(import_name_idx)
        )
        idx = import_name_idx[arg]
        instrs.append([1, idx])
      elif instr == 'call-export':
        arg = next()
        instrs.append([2] + str_encode(arg[1:-1]))
      elif instr == 'read-utf8':
        instrs.append([3])
      elif instr == 'write-utf8':
        arg = next()
        instrs.append([4] + str_encode(arg[1:-1]))
      elif instr == 'as-wasm':
        arg = next()
        instrs.append([5, WASM_TYPES[arg]])
      elif instr == 'as-interface':
        arg = next()
        instrs.append([6, INTERFACE_TYPES[arg]])
      elif instr == 'table-ref-add':
        instrs.append([7])
      elif instr == 'table-ref-get':
        instrs.append([8])
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
