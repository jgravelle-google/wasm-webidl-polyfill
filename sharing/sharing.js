var webIDL;
const isD8 = typeof testRunner != 'undefined';
if (isD8) {
  load('webIDL.js');
  webIDL = { loadWasm, jsToWasmFunc };
} else {
  webIDL = require('./webIDL.js');
}

async function main() {
  var lib = await webIDL.loadWasm('sharing/lib.wasm', {
    env: {
      memory: new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 }),
    },
    host: {
      log: function(obj, msg) { obj.log(msg); },
    },
  });
  lib.exports.init(console);
  lib.exports.cLog("Hello there");

  var main = await webIDL.loadWasm('sharing/main.wasm', {
    env: {
      memory: new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 }),
    },
    lib: lib.exports,
  });
  main.exports.main();
}
main();
