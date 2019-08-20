var webIDL = require('./webIDL.js');
// load('webIDL.js'); var webIDL = {loadWasm};

var wasmImports = {
  js: {
    display(comment) {
      let sign = '';
      if (comment.score > 0) {
        sign = '+';
      }
      console.log(sign + comment.score + ": " + comment.message);
    },
  },
};

async function run() {
  const wasm = await webIDL.loadWasm('struct/struct.wasm', wasmImports);
  const ex = wasm.exports;

  ex.addComment({score: 2019, message: "Test post"});
  ex.addComment({score: -14, message: "Cats are overrated"});
  ex.addComment({score: 0, message: "Help pls"});
  ex.addComment({score: 24, message: "How many?"});
  ex.addComment({score: 404, message: "I'M LOST"});

  ex.displayAll();

  console.log('alloc =', ex.alloc);
}
run();
