var webIDL = require('./webIDL.js');

var lib = webIDL.loadWasm('sharing/lib.wasm', {
  env: {
    memory: new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 }),
  },
  host: {
    getConsole: function () { return console; },
    log: function(obj, msg) { obj.log(msg); },
  },
});
lib.exports.init();

var main = webIDL.loadWasm('sharing/main.wasm', {
  env: {
    memory: new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 }),
  },
  lib: lib.exports,
});
main.exports.main();
