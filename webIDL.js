function polyfill(module, imports) {
  var memory = imports['env']['memory'];
  var refMap = {};
  var refs = [];
  var u8 = memory && new Uint8Array(memory.buffer);
  function utf8_cstr(ptr) {
    var result = '';
    var i = ptr;
    while (u8[i] != 0) {
      result += String.fromCharCode(u8[i]);
      i++;
    }
    return result;
  }
  function utf8_outparam_buffer(str, ptr, bufferLength) {
    var len = Math.min(str.length, bufferLength);
    for (var i = 0; i < len; ++i) {
      u8[ptr + i] = str.charCodeAt(i);
    }
    return len;
  }
  function utf8_constaddr_1024(str) {
    var constaddr = 1024;
    for (var i = 0; i < str.length; ++i) {
      u8[constaddr + i] = str.charCodeAt(i);
    }
    return constaddr;
  }
  function utf8_ptr_len(ptr, len) {
    var result = ''
    for (var i = 0; i < len; ++i) {
      result += String.fromCharCode(u8[ptr + i]);
    }
    return result;
  }
  function native_wasm(x) {
    return x;
  }
  function opaque_ptr_set(ref) {
    var ptr = refs.length;
    if (ref in refMap) {
      ptr = refMap[ref];
    } else {
      refs.push(ref);
      refMap[ref] = ptr;
    }
    return ptr;
  }
  function opaque_ptr_get(ptr) {
    return refs[ptr];
  }

  var webidlTypes = {
    0: 'DOMString',
  }
  var outgoingBindingTypes = {
    0: [utf8_cstr],
  };
  var encoders = {};
  var decoders = {};
  var exportFixups = {};

  var bindingSections = WebAssembly.Module.customSections(module, 'webIDLBindings');
  for (var section = 0; section < bindingSections.length; ++section) {
    var bytes = new Uint8Array(bindingSections[section]);
    var idx = 0;

    function readLEB() {
      // TODO: don't assume LEBs are <128
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
    function readList(f) {
      var len = readByte();
      var result = [];
      for (var i = 0; i < len; ++i) {
        result.push(f());
      }
      return result;
    }

    function readOutgoing() {
      var kind = readByte();
      var ty = readByte();
      var off = readByte();
      if (kind == 0) {
        return {
          func: utf8_cstr,
          args: [off],
        };
      }
    }

    function bind(f, params, results, isImport) {
      var convertParam = isImport ? encoders : decoders;
      var convertResult = isImport ? decoders : encoders;
      return function() {
        var argIdx = 0;
        var args = [];
        for (var i = 0; i < params.length; ++i) {
          var enc = bindingTypes[convertParam[params[i]]];
          var encF = enc[0];
          var nArgs = enc[1];
          if (nArgs > 0) {
            var encArgs = [];
            for (var j = 0; j < nArgs; ++j) {
              encArgs.push(arguments[argIdx++]);
            }
            args.push(encF.apply(null, encArgs));
          }
        }
        var result = f.apply(null, args);
        for (var i = 0; i < results.length; ++i) {
          var dec = bindingTypes[convertResult[results[i]]];
          var decF = dec[0];
          var nArgs = dec[2][1];
          var decArgs = [result];
          for (var j = 0; j < nArgs; ++j) {
            decArgs.push(arguments[argIdx++]);
          }
          return decF.apply(null, decArgs);
        }
      };
    }
    function bindImport(f, params, results) {
      return function() {
        var args = [];
        for (var i = 0; i < params.length; ++i) {
          var param = params[i];
          var encArgs = [];
          for (var j = 0; j < param.args.length; ++j) {
            encArgs.push(arguments[param.args[j]]);
          }
          args.push(param.func.apply(null, encArgs));
        }
        return f.apply(null, args);
      };
    }
    function makeExporter(param, result) {
      return function(f) {
        return bind(f, param, result, false);
      }
    }

    var numDecls = readLEB();
    for (var i = 0; i < numDecls; ++i) {
      var kind = readByte();
      if (kind == 0) {
        var namespace = readStr();
        var name = readStr();
        var params = readList(readOutgoing);
        var results = [];
        imports[namespace][name] = bindImport(imports[namespace][name], params, results);
      } else if (kind == 1) {
        // exportFixups[name] = makeExporter(params, results);
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

  return exportFixups;
}


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
  var fixups = polyfill(module, imports);
  var instance = new WebAssembly.Instance(module, imports);

  // Actual WebAssembly.Instance exports are Read-Only, so we have to create a
  // fake object here
  var fakeExports = {};
  for (var name in instance.exports) {
    fakeExports[name] = instance.exports[name];
  }
  for (var name in fixups) {
    fakeExports[name] = fixups[name](fakeExports[name]);
  }
  var fakeInstance = {};
  for (var name in instance) {
    fakeInstance[name] = instance[name];
  }
  fakeInstance.exports = fakeExports;
  return fakeInstance;
}


if (typeof require !== 'undefined') {
  module.exports = { polyfill, loadWasm }
}
