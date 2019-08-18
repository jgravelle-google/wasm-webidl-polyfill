// var webIDL = require('./webIDL.js');
// load('webIDL.js');
var webIDL = {loadWasm};

var moduleImports = {
  // document,
  // ? unclear why this needs the indirection, throws with TypeError
  document: {
    getElementById: (id) => document.getElementById(id),
  },
  host: {
    getContext: HTMLCanvasElement.prototype.getContext,
    fillRect: CanvasRenderingContext2D.prototype.fillRect,
    setFillStyle: (obj, str) => obj.fillStyle = str,
  },
};

async function load() {
  var wasm = await webIDL.loadWasm('webgl.wasm', moduleImports);
  wasm.exports.main();
}
load();
