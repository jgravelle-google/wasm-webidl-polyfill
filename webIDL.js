var debugEnabled = false;
var debugIndentLevel = 0;
function debug() {
  if (debugEnabled) {
    console.log.apply(this, ['[|DEBUG|]:', '  '.repeat(debugIndentLevel), ...arguments]);
  }
}
function debugIndent() {
  debugIndentLevel += 1;
}
function debugDedent() {
  debugIndentLevel -= 1;
}

function polyfill(module, imports, getExports) {
  var refMap = {};
  var refs = [];
  var u8;
  function initMemory() {
    if (u8) return;
    debug('initializing memory');
    var memory = imports['env']['memory'] || getExports()['memory'];
    u8 = new Uint8Array(memory.buffer);
  }
  function utf8_cstr(ptr) {
    debug('in utf8_cstr:', ptr);
    initMemory();
    var result = '';
    var i = ptr;
    while (u8[i] != 0) {
      result += String.fromCharCode(u8[i]);
      i++;
    }
    return result;
  }
  function utf8_outparam_buffer(str, ptr, bufferLength) {
    initMemory();
    var len = Math.min(str.length, bufferLength);
    for (var i = 0; i < len; ++i) {
      u8[ptr + i] = str.charCodeAt(i);
    }
    return len;
  }
  function alloc_utf8_cstr(args) {
    debug('in alloc_utf8_cstr:', args);
    initMemory();
    var str = this.inExpr(args);
    var addr = getExports()[this.name](str.length + 1);
    for (var i = 0; i < str.length; ++i) {
      u8[addr + i] = str.charCodeAt(i);
    }
    u8[addr + str.length] = 0;
    return addr;
  }
  function utf8_ptr_len(ptr, len) {
    initMemory();
    var result = ''
    for (var i = 0; i < len; ++i) {
      result += String.fromCharCode(u8[ptr + i]);
    }
    return result;
  }

  // Lifting
  function as_outgoing(x) {
    return x;
  }
  function lift_func_idx(tableName, idx) {
    debug('lift_func_idx:', tableName, idx);
    return getExports()[tableName].get(idx);
  }

  // Lowering
  function as_incoming(args) {
    return this.inExpr(args);
  }
  function lower_func_idx() {
    console.log(this);
    console.log(arguments);
    throw 'Unimplemented: lower_func_idx'
  }

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
        debug(i); debugIndent();
        result.push(f());
        debugDedent();
      }
      return result;
    }

    function readOutgoing() {
      var kind = readByte();
      if (kind == 0) { // as
        debug('lifting-as'); debugIndent();
        var ty = readByte();
        debug('ty =', ty);
        var off = readByte();
        debug('off =', off);
        debugDedent();
        return {
          func: as_outgoing,
          args: [off],
        };
      } else if (kind == 1) { // utf8-cstr
        debug('utf8-cstr');
        var ty = readByte();
        var off = readByte();
        return {
          func: utf8_cstr,
          args: [off],
        };
      } else if (kind == 2) { // lift-func-idx
        debug('lift-func-idx'); debugIndent();
        var ty = readByte();
        debug('ty =', ty);
        var tableName = readStr();
        debug('tableName =', tableName);
        var off = readByte();
        debug('off =', off);
        debugDedent();
        return {
          func: lift_func_idx,
          args: [tableName, off],
        };
      } else {
        throw 'Unknown lifting binding: ' + kind
      }
    }

    function readInExpr() {
      var kind = readByte();
      if (kind == 0) { // get
        var idx = readByte();
        debug('get', idx);
        return function(args) {
          return args[idx];
        };
      }
    }
    function readIncoming() {
      var kind = readByte();
      if (kind == 0) { // as
        debug('lowering-as'); debugIndent();
        var ty = readByte();
        debug('ty =', ty);
        var inExpr = readInExpr();
        debugDedent();
        return {
          func: as_incoming,
          inExpr,
        }
      } else if (kind == 1) { // alloc-utf8-cstr
        debug('alloc-utf8-cstr'); debugIndent();
        var name = readStr();
        debug('name =', name);
        var inExpr = readInExpr();
        debugDedent();
        return {
          func: alloc_utf8_cstr,
          name,
          inExpr,
        }
      } else if (kind == 2) { // lower-func-idx
        debug('lower-func-idx'); debugIndent();
        var tableName = readStr();
        debug('tableName =', tableName);
        var inExpr = readInExpr();
        debugDedent();
        return {
          func: lower_func_idx,
          tableName,
          inExpr,
        };
      } else {
        throw 'Unknown lowering binding: ' + kind
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
        debug('Import:', name); debugIndent();
        var importKind = readByte();
        debug('params'); debugIndent();
        var params = readList(readOutgoing);
        debugDedent(); debug('results'); debugIndent();
        var results = readList(readIncoming);
        debugDedent(); debugDedent();
        imports[namespace][name] = bindImport(
          imports[namespace][name], importKind, params, results);
      } else if (kind == 1) {
        var name = readStr();
        debug('Export:', name); debugIndent();
        debug('params'); debugIndent();
        var params = readList(readIncoming);
        debugDedent(); debug('results'); debugIndent();
        var results = readList(readOutgoing);
        debugDedent(); debugDedent();
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

// Taken wholesale from Emscripten
function jsToWasmFunc(func, sig) {
  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // id: section,
    0x00, // length: 0 (placeholder)
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection.push(sigParam.length);
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)
  typeSection[1] = typeSection.length - 2;

  // Rest of the module is static
  var bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version: 1
  ].concat(typeSection, [
    0x02, 0x07, // import section
      // (import "e" "f" (func 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // export section
      // (export "f" (func 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    e: {
      f: func
    }
  });
  var wrappedFunc = instance.exports.f;
  return wrappedFunc;
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
  module.exports = { polyfill, loadWasm, jsToWasmFunc }
}
