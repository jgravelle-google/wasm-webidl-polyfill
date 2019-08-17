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
    host: {
      log: function(obj, msg) { obj.log(msg); },
    },
  });
  lib.exports.init(console);
  lib.exports.cLog("Hello there");

  var main = await webIDL.loadWasm('sharing/main.wasm', {
    lib: lib.exports,
  });
  main.exports.main();

  console.log('lib.memory =', lib.exports.memory);
  console.log('main.memory =', main.exports.memory);
}
main();
