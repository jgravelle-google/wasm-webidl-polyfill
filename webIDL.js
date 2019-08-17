var debugEnabled = false;
var debugIndentLevel = 0;
function debug() {
  if (debugEnabled) {
    console.log.apply(this, ['[|DEBUG|]:', '  '.repeat(debugIndentLevel), ...arguments]);
  }
}
function debugIndent() {
  if (arguments.length > 0) { debug.apply(null, arguments); }
  debugIndentLevel += 1;
}
function debugDedent() {
  debugIndentLevel -= 1;
}
function debugInstr(name, self, stack, args) {
  debugIndent('in instruction', name);
  debug('this =', self);
  debug('stack =', stack);
  debug('args =', args);
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
  function utf8_cstr(args) {
    debugBinding('utf8_cstr', this, args);
    const ptr = args[this.off];
    debug('ptr =', ptr);
    initMemory();
    var result = '';
    var i = ptr;
    while (u8[i] != 0) {
      result += String.fromCharCode(u8[i]);
      i++;
    }
    debugDedent();
    return result;
  }
  function alloc_utf8_cstr(args) {
    debugBinding('alloc_utf8_cstr', this, args);
    initMemory();
    var str = this.inExpr(args);
    var addr = getExports()[this.name](str.length + 1);
    for (var i = 0; i < str.length; ++i) {
      u8[addr + i] = str.charCodeAt(i);
    }
    u8[addr + str.length] = 0;
    debugDedent();
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
  function as_outgoing(args) {
    debugBinding('as_outgoing', this, args);
    debugDedent();
    return args[this.off];
  }
  function lift_func_idx(args) {
    debugBinding('lift_func_idx', this, args);
    debugDedent();
    return getExports()[this.tableName].get(args[this.off]);
  }

  // Lowering
  function as_incoming(args) {
    debugBinding('as_incoming', this, args);
    debugDedent();
    return this.inExpr(args);
  }
  function lower_func_idx(args) {
    debugBinding('lower_func_idx', this, args);
    const table = getExports()[this.tableName];
    let jsIdx = table.length;
    table.grow(1);
    const fn = this.inExpr(args);
    table.set(jsIdx, jsToWasmFunc(fn, this.fnType));
    debugDedent();
    return jsIdx;
  }

  // Export declarations, used for call-export arities
  const exportDecls = {};
  // Original imported functions, accessed by index
  const origImports = [];

  function pop(stack) {
    const ret = stack[stack.length - 1];
    stack.splice(stack.length - 1, 1);
    return ret;
  }
  function popN(stack, n) {
    const ret = [];
    for (var i = 0; i < n; ++i) {
      ret.unshift(pop(stack));
    }
    return ret;
  }
  const Instructions = {
    argGet(stack, args) {
      debugInstr('argGet', this, stack, args);
      stack.push(args[this.arg]);
      debugDedent();
    },
    call(stack) {
      debugInstr('call', this, stack);
      const imp = origImports[this.importIdx];
      debug('import decl =', imp);
      const args = popN(stack, imp.params.length);
      debug('args =', args);
      const ret = imp.import.apply(null, args);
      if (imp.results.length > 0) {
        stack.push(ret);
      }
      debugDedent();
    },
    callExport(stack) {
      debugInstr('callExport', this, stack);
      const exp = exportDecls[this.exportName];
      debug('export decl =', exp);
      const args = popN(stack, exp.params.length);
      debug('args =', args);
      const fn = getExports()[this.exportName];
      const ret = fn.apply(null, args);
      if (exp.results.length > 0) {
        stack.push(ret);
      }
      debugDedent();
    },
    readUtf8(stack) {
      debugInstr('readUtf8', this, stack);
      const len = pop(stack);
      const ptr = pop(stack);
      debug('ptr, len =', ptr, len);
      initMemory();
      let result = '';
      for (var i = 0; i < len; ++i) {
        result += String.fromCharCode(u8[ptr + i]);
      }
      stack.push(result);
      debugDedent();
    },
    writeUtf8(stack) {
      debugInstr('writeUtf8', this, stack);
      const str = pop(stack);
      debug('str =', str);
      const alloc = getExports()[this.alloc];
      const len = str.length;
      const ptr = alloc(len);
      for (var i = 0; i < len; ++i) {
        u8[ptr + i] = str.charCodeAt(i);
      }
      stack.push(ptr);
      stack.push(len);
      debugDedent();
    },
  }

  const exportFixups = {};

  function makeAdapter(params, results, instrs) {
    return function() {
      const stack = [];
      for (var i = 0; i < instrs.length; ++i) {
        const instr = instrs[i];
        instr.func.apply(instr, [stack, arguments]);
      }
      if (results.length > 0) {
        return stack[stack.length - 1];
      }
    };
  }

  var bindingSections = WebAssembly.Module.customSections(module, 'webIDLBindings');
  for (var section = 0; section < bindingSections.length; ++section) {
    var bytes = new Uint8Array(bindingSections[section]);
    var byteIndex = 0;

    function readByte() {
      return bytes[byteIndex++];
    }
    function readLEB() {
      // TODO: don't assume LEBs are <128
      return readByte();
    }
    function readStr() {
      var len = readByte();
      var result = '';
      for (var i = 0; i < len; ++i) {
        result += String.fromCharCode(readByte());
      }
      return result;
    }
    function readWasmType() {
      const ty = readByte();
      if (debugEnabled) {
        const typeMap = {
          0x7f: 'i32',
          0x7e: 'i64',
          0x7d: 'f32',
          0x7c: 'f64',
          0x6f: 'anyref',
        };
        debug('ty =', typeMap[ty]);
      }
      return ty;
    }
    function readInterfaceType() {
      // TODO: interface types may be multi-byte, and depend on a type section
      const ty = readByte();
      if (debugEnabled) {
        const typeMap = {
          0: 'any',
          1: 'int',
          2: 'float',
          3: 'string',
        };
        debug('ty =', typeMap[ty]);
      }
      return ty;
    }

    function readList(f, debugMsg) {
      if (debugMsg !== undefined) {
        debugIndent(debugMsg);
      } else {
        debugIndent();
      }
      var len = readByte();
      var result = [];
      for (var i = 0; i < len; ++i) {
        debugIndent(i);
        result.push(f());
        debugDedent();
      }
      debugDedent();
      return result;
    }

    function readInstr() {
      const opcode = readByte();
      let instr;
      if (opcode === 0) { // arg.get
        debugIndent('arg.get');
        const arg = readByte();
        debug('arg =', arg);
        instr = {
          func: Instructions.argGet,
          arg,
        };
      } else if (opcode === 1) { // call
        debugIndent('call');
        const importIdx = readByte();
        debug('importIdx =', importIdx);
        instr = {
          func: Instructions.call,
          importIdx,
        };
      } else if (opcode === 2) { // call-export
        debugIndent('call-export');
        const exportName = readStr();
        debug('exportName =', exportName);
        instr = {
          func: Instructions.callExport,
          exportName,
        };
      } else if (opcode === 3) { // read-utf8
        debugIndent('read-utf8');
        instr = {
          func: Instructions.readUtf8,
        };
      } else if (opcode === 4) { // write-utf8
        debugIndent('write-utf8');
        const alloc = readStr();
        debug('alloc =', alloc);
        instr = {
          func: Instructions.writeUtf8,
          alloc,
        };
      } else {
        throw 'Unknown opcode: ' + opcode;
      }
      debugDedent();
      return instr;
    }

    function readOutgoing() {
      var kind = readByte();
      if (kind == 0) { // as
        debugIndent('lifting-as');
        var ty = readByte();
        debug('ty =', ty);
        var off = readByte();
        debug('off =', off);
        debugDedent();
        return {
          func: as_outgoing,
          off,
        };
      } else if (kind == 1) { // utf8-cstr
        debug('utf8-cstr');
        var ty = readByte();
        var off = readByte();
        return {
          func: utf8_cstr,
          off,
        };
      } else if (kind == 2) { // lift-func-idx
        debugIndent('lift-func-idx');
        var ty = readByte();
        debug('ty =', ty);
        var tableName = readStr();
        debug('tableName =', tableName);
        var off = readByte();
        debug('off =', off);
        debugDedent();
        return {
          func: lift_func_idx,
          tableName,
          off,
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
        debugIndent('lowering-as');
        var ty = readByte();
        debug('ty =', ty);
        var inExpr = readInExpr();
        debugDedent();
        return {
          func: as_incoming,
          inExpr,
        }
      } else if (kind == 1) { // alloc-utf8-cstr
        debugIndent('alloc-utf8-cstr');
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
        debugIndent('lower-func-idx');
        var tableName = readStr();
        debug('tableName =', tableName);
        var inExpr = readInExpr();
        debugDedent();
        const fnType = 'vi'; // TODO: don't hardcode
        return {
          func: lower_func_idx,
          tableName,
          inExpr,
          fnType,
        };
      } else {
        throw 'Unknown lowering binding: ' + kind
      }
    }

    function bindImport(f, importKind, params, results) {
      return function() {
        debugIndent('in bindImport');
        const args = [];
        debug('params =', params);
        for (var i = 0; i < params.length; ++i) {
          const param = params[i];
          args.push(param.func.apply(param, [arguments]));
        }
        debug('args =', args);
        var retVal;
        if (importKind === 0) {
          // static
          retVal = f.apply(null, args);
        } else if (importKind === 1) {
          // method
          retVal = f.apply(args[0], args.slice(1));
        }
        debug('results =', results);
        if (results.length > 0) {
          var result = results[0]; // todo: multi-return?
          retVal = result.func.apply(result, [[retVal]]);
        }
        debugDedent();
        return retVal;
      };
    }
    function makeExporter(param, result) {
      return function(f) {
        const importKind = 0; // "static", see bindImport
        return bindImport(f, importKind, param, result);
      }
    }

    const numExports = readLEB();
    debug('export count:', numExports);
    for (var i = 0; i < numExports; ++i) {
      debugIndent('export', i);
      const name = readStr();
      debug('name =', name);
      const params = readList(readWasmType, 'params');
      const results = readList(readWasmType, 'results');
      debugDedent();
      exportDecls[name] = {
        params,
        results,
      };
    }

    const numImportFuncs = readLEB();
    debug('import count:', numImportFuncs);
    for (var i = 0; i < numImportFuncs; ++i) {
      debugIndent('import', i);
      const namespace = readStr();
      debug('namespace =', namespace);
      const name = readStr();
      debug('name =', name);
      const params = readList(readInterfaceType, 'params');
      const results = readList(readInterfaceType, 'results');
      debugDedent();
      origImports.push({
        import: imports[namespace][name],
        params,
        results,
      });
    }

    const numAdapters = readLEB();
    debug('adapter count:', numAdapters);
    for (var i = 0; i < numAdapters; ++i) {
      debugIndent('adapter', i);
      const namespace = readStr();
      debug('namespace =', namespace);
      const name = readStr();
      debug('name =', name);
      const params = readList(readWasmType, 'params');
      const results = readList(readWasmType, 'results');
      const instrs = readList(readInstr, 'instrs');
      debugDedent();
      imports[namespace][name] = makeAdapter(params, results, instrs);
    }

    debug('unread bytes:', bytes[byteIndex] !== undefined);
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

// Taken wholesale from Emscripten, renamed from convertJsFunctionToWasm
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
    // D8
    bytes = read(filename, 'binary');
  } else if (typeof require === 'function') {
    // NodeJS
    var fs = require('fs');
    bytes = fs.readFileSync(filename);
  } else {
    // Browser
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
