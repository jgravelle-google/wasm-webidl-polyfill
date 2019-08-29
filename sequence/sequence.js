const webIDL = require('./webIDL.js');
// load('webIDL.js'); const webIDL = {loadWasm};

const wasmImports = {
  js: {
    log: (x) => {
      // console.log(x)
    },
  },
};

async function run() {
  const moduleNames = [
    'array.wasm',
    // 'list.wasm',
  ];
  for (const m of moduleNames) {
    console.log('Module:', m);
    const wasm = await webIDL.loadWasm('sequence/' + m, wasmImports);
    const ex = wasm.exports;

    const list = [10, 20, 14, 3, 9, 32, 6, 18];
    console.log(ex.average(list)); // should be 14
    // console.log(ex.reversed(list));
    console.log('');
  }
}
run();
