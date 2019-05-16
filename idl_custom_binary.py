#!/usr/bin/env python

import json
import os
import sys

WEBIDL_TYPES = {
  'any': 0,
  'DOMString': 1,
  'int': 2,
  'float': 3,
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
  for i in xrange(4):
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
  for i in xrange(len(text)):
    c = text[i]
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
def inExpr(sexpr):
  head = sexpr[0]
  if head == 'get':
    idByte = 0
    off = int(sexpr[1])
    return [idByte, off]

def main(args):
  assert len(args) == 2, "Must have infile and outfile (in that order)"
  infile = args[0]
  outfile = args[1]
  contents = open(infile, 'r').read()
  data = parse_webidl(contents)
  binary = custom_section_binary('webIDLBindings', data)
  with open(outfile, 'wb') as f:
    for byte in binary:
      f.write(chr(byte))
  return 0

if __name__ == '__main__':
  sys.exit(main(sys.argv[1:]))
