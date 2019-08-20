var debugEnabled = false;
debugEnabled = true;
var debugIndentLevel = 0;
function debug() {
  if (debugEnabled) {
    console.log.apply(this, ['[|DEBUG|]', '  '.repeat(debugIndentLevel), ...arguments]);
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
  if (args !== undefined) {
    debug('args =', args);
  }
}

function polyfill(module, imports, getExports) {
  var u8;
  function initMemory() {
    if (u8) return;
    debug('initializing memory');
    var memory = getExports()['memory'] || imports['env'] && imports['env']['memory'];
    u8 = new Uint8Array(memory.buffer);
  }

  // Export declarations, used for call-export arities
  const exportDecls = {};
  // Original imported functions, accessed by index
  const origImports = [];
  // Table of references, converts i32 <-> any
  const refTable = [];

  function pop(stack) {
    return stack.splice(stack.length - 1, 1)[0];
  }
  function popN(stack, n) {
    // Return an array of N items, in the order they were pushed
    // e.g. stack = [4, 5, 6]; popN(stack, 2) == [5, 6]
    return stack.splice(stack.length - n, n);
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
        debug('ret =', ret);
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
        debug('ret =', ret);
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
      let str = '';
      for (var i = 0; i < len; ++i) {
        str += String.fromCharCode(u8[ptr + i]);
      }
      debug('str =', str);
      stack.push(str);
      debugDedent();
    },
    writeUtf8(stack) {
      debugInstr('writeUtf8', this, stack);
      const str = pop(stack);
      debug('str =', str);
      const alloc = getExports()[this.alloc];
      const len = str.length;
      const ptr = alloc(len);
      initMemory();
      for (var i = 0; i < len; ++i) {
        u8[ptr + i] = str.charCodeAt(i);
      }
      stack.push(ptr);
      stack.push(len);
      debugDedent();
    },
    asWasm(stack) {
      debugInstr('asWasm', this, stack);
      debugDedent();
    },
    asInterface(stack) {
      debugInstr('asInterface', this, stack);
      debugDedent();
    },
    tableRefAdd(stack) {
      debugInstr('tableRefAdd', this, stack);
      const ref = pop(stack);
      debug('ref = ', ref);
      const idx = refTable.length;
      refTable.push(ref);
      debug('refTable =', refTable);
      debug('idx = ', idx);
      stack.push(idx);
      debugDedent();
    },
    tableRefGet(stack) {
      debugInstr('tableRefGet', this, stack);
      const idx = pop(stack);
      debug('idx = ', idx);
      debug('refTable =', refTable);
      const ref = refTable[idx];
      debug('ref = ', ref);
      stack.push(ref);
      debugDedent();
    },
    callMethod(stack) {
      debugInstr('callMethod', this, stack);
      const imp = origImports[this.importIdx];
      debug('import decl =', imp);
      const args = popN(stack, imp.params.length - 1);
      const self = pop(stack);
      debug('self =', self);
      debug('args =', args);
      const ret = imp.import.apply(self, args);
      if (imp.results.length > 0) {
        debug('ret =', ret);
        stack.push(ret);
      }
      debugDedent();
    },
  }

  const interface = {};

  function makeAdapter(name, params, results, instrs) {
    return function() {
      debugIndent('Called function:', name);
      const stack = [];
      for (var i = 0; i < instrs.length; ++i) {
        const instr = instrs[i];
        instr.func.apply(instr, [stack, arguments]);
      }
      debugDedent();
      if (results.length > 0) {
        return stack[stack.length - 1];
      }
    };
  }

  var bindingSections = WebAssembly.Module.customSections(module, 'interface-types');
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
    const interfaceTypeMap = {
      0x7f: 'Int',
      0x7e: 'Float',
      0x7d: 'Any',
      0x7c: 'String',
    };
    function readInterfaceType() {
      // TODO: interface types may be multi-byte, and depend on a type section
      const ty = readByte();
      let name = interfaceTypeMap[ty];
      if (typeof name === 'object') {
        name = name.name;
      }
      debug('ty =', ty, ":", name);
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
      if (opcode === 0x00) { // arg.get
        debugIndent('arg.get');
        const arg = readByte();
        debug('arg =', arg);
        instr = {
          func: Instructions.argGet,
          arg,
        };
      } else if (opcode === 0x01) { // call
        debugIndent('call');
        const importIdx = readByte();
        debug('importIdx =', importIdx);
        instr = {
          func: Instructions.call,
          importIdx,
        };
      } else if (opcode === 0x02) { // call-export
        debugIndent('call-export');
        const exportName = readStr();
        debug('exportName =', exportName);
        instr = {
          func: Instructions.callExport,
          exportName,
        };
      } else if (opcode === 0x03) { // read-utf8
        debugIndent('read-utf8');
        instr = {
          func: Instructions.readUtf8,
        };
      } else if (opcode === 0x04) { // write-utf8
        debugIndent('write-utf8');
        const alloc = readStr();
        debug('alloc =', alloc);
        instr = {
          func: Instructions.writeUtf8,
          alloc,
        };
      } else if (opcode === 0x05) { // as-wasm
        debugIndent('as-wasm');
        const ty = readWasmType();
        instr = {
          func: Instructions.asWasm,
          ty,
        }
      } else if (opcode === 0x06) { // as-interface
        debugIndent('as-interface');
        const ty = readInterfaceType();
        instr = {
          func: Instructions.asInterface,
          ty,
        }
      } else if (opcode === 0x07) { // table-ref-add
        debugIndent('table-ref-add');
        instr = {
          func: Instructions.tableRefAdd,
        };
      } else if (opcode === 0x08) { // table-ref-get
        debugIndent('table-ref-get');
        instr = {
          func: Instructions.tableRefGet,
        };
      } else if (opcode === 0x09) { // call-method
        debugIndent('call-method');
        const importIdx = readByte();
        debug('importIdx =', importIdx);
        instr = {
          func: Instructions.callMethod,
          importIdx,
        };
      } else {
        throw 'Unknown opcode: ' + opcode;
      }
      debugDedent();
      return instr;
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

    const numTypes = readLEB();
    debug('type count:', numTypes);
    for (var i = 0; i < numTypes; ++i) {
      debugIndent('type', i);
      const name = readStr();
      debug('name =', name);
      const fields = readList(readStr, 'fields');
      debug('fields =', fields);
      const types = readList(readInterfaceType, 'types');
      debugDedent();
      interfaceTypeMap[i] = {
        name,
        fields,
        types,
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
      const isImport = readByte() == 0;
      debug('isImport =', isImport)
      let namespace;
      let typeReader;
      if (isImport) {
        namespace = readStr();
        debug('namespace =', namespace);
        typeReader = readWasmType;
      } else {
        typeReader = readInterfaceType;
      }
      const name = readStr();
      debug('name =', name);
      const params = readList(typeReader, 'params');
      const results = readList(typeReader, 'results');
      const instrs = readList(readInstr, 'instrs');
      debugDedent();
      if (isImport) {
        imports[namespace][name] = makeAdapter(name, params, results, instrs);
      } else {
        interface[name] = makeAdapter(name, params, results, instrs);
      }
    }

    const numForwards = readLEB();
    debug('forward count:', numForwards);
    for (var i = 0; i < numForwards; ++i) {
      debugIndent('forward', i);
      const name = readStr();
      debug('name =', name);
      Object.defineProperty(interface, name, {
        get() {
          debug('Getting forwarded export:', name);
          return getExports()[name];
        }
      });
      debugDedent();
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

  return interface;
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
  var interface = polyfill(module, imports, getExports);
  instance = new WebAssembly.Instance(module, imports);

  // Actual WebAssembly.Instance exports are Read-Only, so we have to create a
  // fake object here
  var fakeInstance = {};
  for (var name in instance) {
    fakeInstance[name] = instance[name];
  }
  fakeInstance.exports = interface;
  return fakeInstance;
}

var isNodeJS = typeof require !== 'undefined';
if (isNodeJS) {
  module.exports = { polyfill, loadWasm, jsToWasmFunc }
}
