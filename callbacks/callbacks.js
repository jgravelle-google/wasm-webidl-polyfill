var webIDL;
const isD8 = typeof testRunner != 'undefined';
if (isD8) {
  load('webIDL.js');
  webIDL = { loadWasm, jsToWasmFunc };
} else {
  webIDL = require('./webIDL.js');
}

var wasm;
const moduleImports = {
  env: {
    console_log: (str, arg) => console.log(str, arg),
    callCallback: (f) => f(15),
  },
};

async function loadFile() {
  wasm = await webIDL.loadWasm('callbacks/callbacks.wasm', moduleImports);
  wasm.exports._Z11doSomethingv();
  wasm.exports._Z11getCallbackv()(6);

  var total = 0;
  wasm.exports._Z20callImportedCallbackPFviE((x) => {
    console.log('in added js function:');
    console.log('  x =', x);
    total += x;
    console.log('  total =', total);
  });
}
loadFile();
