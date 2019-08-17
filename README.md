# WebIDL Bindings Polyfill

## Summary

This repo holds some sample / test code for the development of the WebAssembly
[Interface Types Proposal](https://github.com/WebAssembly/webidl-bindings). Its
purpose is to iterate on the proposal by letting us experiment with running
code.

## Adapter Instructions

instruction | opcode | immediates | signature
------------|--------|------------|----------
arg.get | 0x00 | param-index | [] -> [ty(param)]
call | 0x01 | import-index | sig(import)
call-export | 0x02 | export-name | sig(export)
read-utf8 | 0x03 | | [i32, i32] -> [string]
write-utf8 | 0x04 | export-name | [string] -> [i32, i32]
as-wasm | 0x05 | wasm-type | [interfaceTy(wasm)] -> [wasm]
as-interface | 0x06 | interface-type | [wasmTy(interface)] -> [interface]
table-ref-add | 0x07 | | [any] -> [i32]
table-ref-get | 0x08 | | [i32] -> [any]

## Binary Format

The current binary format in this repo is a placeholder format. In the future it
should align with the proposed binary format.

There are four subsections:

1. Exported function declarations
*  Imported function declarations
*  Adapter functions
*  Forwarded exports

### Custom section preamble

The bindings are represented as a custom section with the name `webIDLBindings`.
Custom sections follow a standard preamble:
```
0x00 ;; custom section
leb_u32(size) ;; size of the section
string("webIDLBindings") ;; name of the section
```

### Exported function declarations

Exported functions are declared here with a signature. This is redundant
information, but makes polyfilling more convenient because we don't need to
parse the whole wasm module to determine exported function signatures.

TODO: more

### Imported functions

TODO

### Adapter functions

TODO

### Forwarded exports

TODO

## Flags

Makes use of the following V8 flags:

* `--experimental-wasm-anyref`

Run on command line: `node --experimental-wasm-anyref [.js file]`

In Chrome: `chrome --js-flags="--experimental-wasm-anyref"`
