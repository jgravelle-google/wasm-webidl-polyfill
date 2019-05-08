// var webIDL = require('./webIDL.js');
// load('webIDL.js');
var webIDL = {loadWasm};

var moduleImports = {
  env: {
    memory: new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 }),
  },
  // document,
  // ? unclear why this needs the indirection, throws with TypeError
  document: {
    getElementById: (id) => document.getElementById(id),
  },
  host: {
    getContext: (obj, str) => obj.getContext(str),
    fillRect: (obj, x, y, w, h) => obj.fillRect(x, y, w, h),
    setFillStyle: (obj, str) => obj.fillStyle = str,
  },
};

async function load() {
  var wasm = await webIDL.loadWasm('webgl.wasm', moduleImports);
  wasm.exports.main();
}
load();
