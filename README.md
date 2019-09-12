# Interface Types Polyfill

## Summary

This repo holds some sample / test code for the development of the WebAssembly
[Interface Types Proposal](https://github.com/WebAssembly/webidl-bindings). Its
purpose is to iterate on the proposal by letting us experiment with running
code.

## Repo structure

Individual demos live in folders. Given a folder named Foo:

* Foo/Foo\_base.wat : Wasm code
* Foo/Foo\_interface.wat : Interface annotations
* Foo/Foo.js : JS code to load and run Foo demo

Top-level scripts:

* webIDL.js : runtime polyfill, reads custom section and interprets it
* idl\_custom\_binary.py : script to parse @interface declarations from .wat and
  build the "interface-types" custom section
* Makefile : rules to build .wasm files from .wats

## Interface Types

By convention, Interface Types are capitalized, where Wasm types are not (e.g.
Int vs i32)

Type | Encoding | Description
-----|-------|-------------
`Int` | 0x7fff | integer number
`Float` | 0x7ffe | floating-point number
`Any` | 0x7ffd | opaque reference
`String` | 0x7ffc | string data

## Adapter Instructions

Instruction | Opcode | Immediates | Signature | Description
------------|--------|------------|-----------|-------------
`arg.get` | 0x00 | param-index | [] -> [ty(param)] | Access the function's arguments
`call` | 0x01 | import-index | sig(import) | Call a function import (Interface types)
`call-export` | 0x02 | export-name | sig(export) | Call a function export (Wasm types)
`read-utf8` | 0x03 | | [i32, i32] -> [String] | Read a string out of memory, given a pointer + length
`write-utf8` | 0x04 | export-name | [String] -> [i32, i32] | Write a string into memory, return pointer + length
`as-wasm` | 0x05 | wasm-type | [interfaceTy(wasm)] -> [wasm] | Cast an Interface type to a Wasm type
`as-interface` | 0x06 | interface-type | [wasmTy(interface)] -> [interface] | Cast a Wasm type to an Interface type
`table-ref-add` | 0x07 | | [Any] -> [i32] | Add a reference to a table, returns an index for that reference
`table-ref-get` | 0x08 | | [i32] -> [Any] | Given an index, return the reference associated
`call-method` | 0x09 | import-index | sig(import) | Call a function import, with the first argument bound as the `this` parameter
`make-record` | 0x0a | type-index | fields(record) -> [record] | Creates a record object of a given type
`get-field` | 0x0c | type, field-index | [record] -> [field(record)] | Gets a field value from a record object
`const` | 0x0d | type, value | [] -> [type] | Pushes a constant value. Really only i32 at the moment
`fold-seq` | 0x0e | import-index | [Seq<T>] + sig(import) -> result(import) | Calls a function on every element of a sequence, carrying an accumulator value across
`add` | 0x0f | type | [T, T] -> [T] | Add two numbers together
`mem-to-seq` | 0x10 | type, memory-name | [i32, i32] -> [Seq<T>] | Loads a pointer+length into a sequence
`load` | 0x11 | type, memory-name | [i32] -> [T] | Loads a scalar value from memory

## Binary Format

The current binary format in this repo is a placeholder format. In the future it
should align with the proposed binary format.

There are five subsections:

1. Exported function declarations
1. Type declarations
1. Imported function declarations
1. Adapter functions
1. Forwarded exports

### Common patterns

`leb_u32(x)` is an unsigned LEB with value no larger than a 32 bit number.

`string(x)` is the length of the string x (leb_u32-encoded), followed by the
bytes of the string.

### Custom section preamble

The bindings are represented as a custom section with the name
`interface-types`. Custom sections follow a standard preamble:
```
0x00 ;; section ID, 0=custom
leb_u32(size) ;; size of the section
string("interface-types") ;; name of the section
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
