var webIDL = require('./webIDL.js');

var moduleImports = {
  env: {
    memory: new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 }),
  },
  host: {
    console_log: console.log,
    document_title: function() { return process.title; },
  },
  lib: {
    to_upper: function (c) {
      return String.fromCharCode(c).toUpperCase().charCodeAt(0);
    },
  },
};

var wasm = webIDL.loadWasm('to_upper.wasm', moduleImports);
wasm.exports.main();
