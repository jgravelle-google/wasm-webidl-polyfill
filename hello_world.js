var webIDL = require('./webIDL.js');

var moduleImports = {
  env: {
    memory: new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 }),
  },
  host: {
    console_log: console.log,
    document_title: function() { return process.title; },
  },
};

var wasm = webIDL.loadWasm('hello_world.wasm', moduleImports);
wasm.exports.main();
