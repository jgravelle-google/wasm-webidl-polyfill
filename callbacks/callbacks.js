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
    console_log: (ptr, arg) => console.log(ptr, arg),
    callCallback: (ptr) => {
      console.log("called callCallback w/", ptr);
      let table = wasm.exports['__indirect_function_table'];
      table.get(ptr)(15);
    },
  },
};

async function loadFile() {
  wasm = await webIDL.loadWasm('callbacks/callbacks.wasm', moduleImports);
  wasm.exports._Z11doSomethingv();
  wasm.exports._Z11getCallbackv()(6);

  // let idx = wasm.exports._Z11getCallbackv();
  // let table = wasm.exports['__indirect_function_table'];
  // table.get(idx)(6);

  // let jsIdx = table.length;
  // table.grow(1);
  // table.set(jsIdx, webIDL.jsToWasmFunc((x) => {
  //   console.log('in added js function: ', jsIdx);
  //   console.log('  x =', x);
  // }, 'vi'));
  // wasm.exports._Z20callImportedCallbackPFviE(jsIdx);
}
loadFile();
