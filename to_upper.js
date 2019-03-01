var webIDL = require('./webIDL.js');

var memory = new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 });
var moduleImports = {
  env: {
    memory: memory,
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

var main = webIDL.loadWasm('to_upper.wasm', moduleImports);
main.exports.main();
