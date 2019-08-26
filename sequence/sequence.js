const webIDL = require('./webIDL.js');
// load('webIDL.js'); const webIDL = {loadWasm};

const wasmImports = {
};

async function run() {
  const moduleNames = [
    'array.wasm',
    'list.wasm',
  ];
  for (const m in moduleNames) {
    const wasm = await webIDL.loadWasm('sequence/' + m, wasmImports);
    const ex = wasm.exports;

    const list = [10, 20, 14, 3, 9, 32, 6, 18];
    console.log('Module:', m);
    console.log(ex.average(list));
    console.log(ex.reversed(list));
    console.log('');
  }
}
run();
