// var webIDL = require('./webIDL.js');
load('webIDL.js'); var webIDL = {loadWasm};

var moduleImports = {
  env: {
    memory: new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 }),
    // refs: new WebAssembly.Table({ 'element': 'anyref', 'initial': 16 }),
  },
  host: {
    getConsole: function () { return console; },
    log: function(obj, msg) { obj.log(msg); },
  },
};

var wasm = webIDL.loadWasm('anyref/anyref.wasm', moduleImports);
wasm.exports.main();
