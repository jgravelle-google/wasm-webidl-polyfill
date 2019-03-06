#!/usr/bin/env python

import json
import os
import sys

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
  binary_size = (
    len(data) +
    len(section_name) +
    1
  )

  # iterate until size_leb reaches a fixed point (should be very fast)
  size_leb = leb_u32(binary_size)
  last_size = 1
  while len(size_leb) != last_size:
    binary_size += len(size_leb) - last_size
    last_size = len(size_leb)
    size_leb = leb_u32(binary_size)

  return (
    [0] + # custom section
    size_leb + # payload_len
    [len(section_name)] + # name_len
    [ord(c) for c in section_name] +
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

WEBIDL_TYPES = {
  'domString': 0,
  'int': 1,
  'anyref': 2,
}

BINDING_TYPES = {
  'utf8_nullterm': 0,
  'utf8_outparam_buffer': 1,
  'nativeWasm': 2,
  'opaque_ptr_set': 3,
  'opaque_ptr_get': 4,
}

def str_encode(text):
  return leb_u32(len(text)) + [ord(c) for c in text]

def parse_webidl(contents):
  idl_section = contents.split('(;webidl')[1].split('webidl;)')[0].strip()
  sexprs = parse_sexprs(idl_section)
  data = {
    'encodes': [],
    'decodes': [],
    'declarations': [],
  }
  for subsection in sexprs:
    if subsection[0] == 'encode':
      for i in xrange(1, len(subsection)):
        sexp = subsection[i]
        ty = WEBIDL_TYPES[sexp[0]]
        binding = BINDING_TYPES[sexp[1]]
        data['encodes'].append([ty, binding])
    elif subsection[0] == 'decode':
      for i in xrange(1, len(subsection)):
        sexp = subsection[i]
        ty = WEBIDL_TYPES[sexp[0]]
        binding = BINDING_TYPES[sexp[1]]
        data['decodes'].append([ty, binding])
    elif subsection[0] == 'declarations':
      for i in xrange(1, len(subsection)):
        sexp = subsection[i]
        kind = 0 if sexp[0] == 'import' else 1
        namespace = sexp[1][1:-1]
        name = sexp[2][1:-1]
        params = []
        results = []
        for arg in sexp[3:]:
          if arg[0] == 'param':
            params += [WEBIDL_TYPES[x] for x in arg[1:]]
          elif arg[0] == 'result':
            results += [WEBIDL_TYPES[x] for x in arg[1:]]
          else:
            assert False, 'Unexpected param kind: ' + arg[0]
        data['declarations'].append(
          [kind] +
          str_encode(namespace) +
          str_encode(name) +
          leb_u32(len(params)) + params +
          leb_u32(len(results)) + results
        )

  def flatten(lst):
    return [item for sublist in lst for item in sublist]
  def segment(part):
    return leb_u32(len(part)) + flatten(part)

  return (
    segment(data['encodes']) +
    segment(data['decodes']) +
    segment(data['declarations'])
  )

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
