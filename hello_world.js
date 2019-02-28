/*---------------------\
|  webIDL_polyfill.js  |
\---------------------*/

function webIDL_polyfill(module, memory, imports) {
  var u8 = new Uint8Array(memory.buffer);
  function utf8_nullterm(ptr) {
    var result = '';
    var i = ptr;
    while (u8[i] != 0) {
      result += String.fromCharCode(u8[i]);
      i++;
    }
    return result;
  }
  function utf8_outparam_buffer(str, ptr, len) {
    for (var i = 0; i < str.length && i < len; ++i) {
      u8[ptr + i] = str.charCodeAt(i);
    }
  }

  var webidlTypes = {
    0: 'domString',
  }
  var bindingTypes = {
    // enum: [function, numParams, numResults]
    0: [utf8_nullterm, 1, 0],
    1: [utf8_outparam_buffer, 2, 0],
  };
  var encoders = {};
  var decoders = {};

  var bindingSections = WebAssembly.Module.customSections(module, 'webIDLBindings');
  for (var section = 0; section < bindingSections.length; ++section) {
    var bytes = new Uint8Array(bindingSections[section]);
    var idx = 0;

    function readLEB() {
      return bytes[idx++];
    }
    function readByte() {
      return bytes[idx++];
    }
    function readStr() {
      var len = readByte();
      var result = '';
      for (var i = 0; i < len; ++i) {
        result += String.fromCharCode(readByte());
      }
      return result;
    }
    function readList() {
      var len = readByte();
      var result = [];
      for (var i = 0; i < len; ++i) {
        result.push(readByte());
      }
      return result;
    }

    var numEncodes = readLEB();
    for (var i = 0; i < numEncodes; ++i) {
      var ty = readByte();
      var enc = readByte();
      encoders[ty] = enc;
    }
    var numDecodes = readLEB();
    for (var i = 0; i < numDecodes; ++i) {
      var ty = readByte();
      var enc = readByte();
      decoders[ty] = enc;
    }

    function bind(f, params, results) {
      return function() {
        var argIdx = 0;
        var args = [];
        for (var i = 0; i < params.length; ++i) {
          var enc = bindingTypes[encoders[params[i]]];
          var encF = enc[0];
          var nArgs = enc[1];
          if (nArgs > 0) {
            var encArgs = [];
            for (var j = 0; j < nArgs; ++j) {
              encArgs.push(arguments[argIdx++]);
            }
            args.push(encF(encArgs));
          }
        }
        var result = f.apply(null, args);
        for (var i = 0; i < results.length; ++i) {
          var dec = bindingTypes[decoders[results[i]]];
          var decF = dec[0];
          var nArgs = dec[1];
          if (nArgs > 0) {
            var decArgs = [result];
            for (var j = 0; j < nArgs; ++j) {
              decArgs.push(arguments[argIdx++]);
            }
            return decF.apply(null, decArgs);
          }
        }
      };
    }

    var numDecls = readLEB();
    for (var i = 0; i < numDecls; ++i) {
      var kind = readByte();
      var namespace = readStr();
      var name = readStr();
      var params = readList();
      var results = readList();
      if (kind == 0) {
        imports[namespace][name] = bind(imports[namespace][name], params, results);
      }
    }
  }

  // Effectively this automates:

  // var real_console_log = imports['host']['console_log'];
  // imports['host']['console_log'] = function(ptr) {
  //   var arg = bindingTypes[0](ptr);
  //   real_console_log(arg);
  // };

  // var real_document_title = imports['host']['document_title'];
  // imports['host']['document_title'] = function(ptr, len) {
  //   var res = real_document_title();
  //   bindingTypes[1](res, ptr, len);
  // };

  return imports;
}

/*---------------------\
|      user code       |
\---------------------*/

function loadWasm(filename, imports) {
  imports = imports || {};
  var bytes;
  if (typeof read === 'function') {
    bytes = read(filename, 'binary');
  } else {
    var fs = require('fs');
    bytes = fs.readFileSync(filename);
  }

  var module = new WebAssembly.Module(bytes);
  var polyfilled = webIDL_polyfill(module, memory, imports);
  var instance = new WebAssembly.Instance(module, polyfilled);
  return instance;
}

var memory = new WebAssembly.Memory({ 'initial': 256, 'maximum': 256 });
var moduleImports = {
  env: {
    memory: memory,
  },
  host: {
    console_log: console.log,
    document_title: function() { return process.title; },
  },
};

var main = loadWasm('hello_world.wasm', moduleImports);
main.exports.main();