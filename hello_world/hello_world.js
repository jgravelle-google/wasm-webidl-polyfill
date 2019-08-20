var webIDL = require('./webIDL.js');
// load('webIDL.js'); var webIDL = {loadWasm};

var moduleImports = {
  host: {
    console_log: console.log,
    document_title: function() { return process.argv[0]; },
  },
};

async function loadFile() {
  var wasm = await webIDL.loadWasm('hello_world/hello_world.wasm', moduleImports);
  wasm.exports.main();
}
loadFile();
