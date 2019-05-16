function polyfill(module, imports, getExports) {
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
  function alloc_utf8_cstr(args) {
    var str = this.inExpr(args);
    var addr = getExports()[this.name](str.length + 1);
    for (var i = 0; i < str.length; ++i) {
      u8[addr + i] = str.charCodeAt(i);
    }
    u8[addr + str.length] = 0;
    return addr;
  }
  function utf8_ptr_len(ptr, len) {
    var result = ''
    for (var i = 0; i < len; ++i) {
      result += String.fromCharCode(u8[ptr + i]);
    }
    return result;
  }
  function as_outgoing(x) {
    return x;
  }
  function as_incoming(args) {
    return this.inExpr(args);
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
    var byteIndex = 0;

    function readLEB() {
      // TODO: don't assume LEBs are <128
      return bytes[byteIndex++];
    }
    function readByte() {
      return bytes[byteIndex++];
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
      if (kind == 0) { // as
        var ty = readByte();
        var off = readByte();
        return {
          func: as_outgoing,
          args: [off],
        };
      } else if (kind == 1) { // utf8-cstr
        var ty = readByte();
        var off = readByte();
        return {
          func: utf8_cstr,
          args: [off],
        };
      }
    }

    function readInExpr() {
      var kind = readByte();
      if (kind == 0) { // get
        var idx = readByte();
        return function(args) {
          return args[idx];
        };
      }
    }
    function readIncoming() {
      var kind = readByte();
      if (kind == 0) { // as
        var ty = readByte();
        var inExpr = readInExpr();
        return {
          func: as_incoming,
          inExpr,
        }
      } else if (kind == 1) { // alloc-utf8-cstr
        var name = readStr();
        var inExpr = readInExpr();
        return {
          func: alloc_utf8_cstr,
          name,
          inExpr,
        }
      }
    }

    function bindImport(f, importKind, params, results) {
      return function() {
        var args = [];
        for (var i = 0; i < params.length; ++i) {
          var param = params[i];
          var incArgs = [];
          for (var j = 0; j < param.args.length; ++j) {
            incArgs.push(arguments[param.args[j]]);
          }
          args.push(param.func.apply(null, incArgs));
        }
        var retVal;
        if (importKind === 0) {
          // static
          retVal = f.apply(null, args);
        } else if (importKind === 1) {
          // method
          retVal = f.apply(args[0], args.slice(1));
        }
        if (results.length > 0) {
          var result = results[0]; // todo: multi-return?
          retVal = result.func.apply(result, [[retVal]]);
        }
        return retVal;
      };
    }
    function makeExporter(param, result) {
      return function(f) {
        // maybe this works? TODO, find out
        importKind = 0;
        return bindImport(f, importKind, param, result);
      }
    }

    var numTypes = readLEB();
    for (var i = 0; i < numTypes; ++i) {
      // skip doing anything with types for now
      // assumption, types are all 1 byte long, this will change
      readByte();
    }

    var numDecls = readLEB();
    for (var i = 0; i < numDecls; ++i) {
      var kind = readByte();
      if (kind == 0) {
        var namespace = readStr();
        var name = readStr();
        var importKind = readByte();
        var params = readList(readOutgoing);
        var results = readList(readIncoming);
        imports[namespace][name] = bindImport(
          imports[namespace][name], importKind, params, results);
      } else if (kind == 1) {
        var name = readStr();
        var params = readList(readIncoming);
        var results = readList(readOutgoing);
        exportFixups[name] = makeExporter(params, results);
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


async function loadWasm(filename, imports) {
  imports = imports || {};
  var bytes;
  if (typeof read === 'function') {
    bytes = read(filename, 'binary');
  } else if (typeof require === 'function') {
    var fs = require('fs');
    bytes = fs.readFileSync(filename);
  } else {
    var fetched = await fetch(filename);
    bytes = await fetched.arrayBuffer();
  }

  var module = new WebAssembly.Module(bytes);
  var instance;
  function getExports() {
    return instance.exports;
  }
  var fixups = polyfill(module, imports, getExports);
  instance = new WebAssembly.Instance(module, imports);

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

var isNodeJS = typeof require !== 'undefined';
if (isNodeJS) {
  module.exports = { polyfill, loadWasm }
}
