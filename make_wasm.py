import subprocess
import sys
import os

wasm2wat = '/s/wbin/wat2wasm'

wat = sys.argv[1]
base = os.path.splitext(wat)[0]
dirname = os.path.dirname(base)
code = base + '.wasm_code'
idl = base + '.idl_section'
wasm = base + '.wasm'

def run(cmd):
  return subprocess.check_output(cmd)

flags = [
  '--enable-multi-value',
  '--enable-reference-types',
]
run([wasm2wat, wat, '-o', code] + flags)
run(['python', 'idl_custom_binary.py', wat, idl])
result = run(['cat', code, idl])
with open(wasm, 'w') as f:
  f.write(result)
run(['cp', 'webIDL.js', dirname])
