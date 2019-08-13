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

  // Call function which calls callCallback import
  wasm.exports._Z11doSomethingv();

  // Return a callback and call it
  wasm.exports._Z11getCallbackv()(6);

  // Provide a JS function to wasm, which calls it twice
  var total = 0;
  wasm.exports._Z20callImportedCallbackPFviE((x) => {
    console.log('in added js function:');
    console.log('  x =', x);
    total += x;
    console.log('  total =', total);
  });
}
loadFile();
