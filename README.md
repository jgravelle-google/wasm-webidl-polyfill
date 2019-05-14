# WebIDL Bindings Polyfill

## Summary

This repo holds some sample / test code for the development of the WebAssembly
[WebIDL Bindings Proposal](https://github.com/WebAssembly/webidl-bindings). Its
purpose is to
1. Help to iterate on the proposal by letting us experiment with running code.
1. Produce a polyfill that can be used before the standard is accepted, before
  all the implementations are completed, and as a fallback to feature detection
  going forward.

## Binary Format

The current binary format in this repo is a placeholder format. In the future it
should align with the proposed binary format.

The bindings are represented as a custom section with the name `webIDLBindings`.
So the section starts with the custom section preamble:
```
0x00 ;; custom section
[size] ;; size of the section
0x0e 'w' 'e' 'b' 'I' 'D' 'L' 'B' 'i' 'n' 'd' 'i' 'n' 'g' 's' ;; length, name
```

TODO: more

## Flags

Depends on the following V8 flags:
* `--experimental-wasm-anyref`

Run on command line: `d8 --experimental-wasm-anyref [.js file]`

In Chrome: `chrome --js-flags="--experimental-wasm-anyref"`
