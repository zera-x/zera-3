// NAME
// ====
//
// WonderScript - A simple lisp that compiles to JavaScript from EDN, JSON, or JavaScript literal sources
//
// SYNOPSIS
// ========
//
// WonderScript to be a simple lisp in the spirit of PicoLisp and Scheme, that can be used as a standalone
// language or as an embedded language in JavaScript, for generating JavaScript code.  It features a Prolog
// (called Honey), for querying databases, graphs, or the DOM.  It also is integrated with two other languages
// "Peanut Butter" for generating HTML, and XML languages and integrating with the DOM, and Jelly for generating
// stylesheets.
//
// WonderScript takes inspiration from various languages including Clojure, PicoLisp, Racket, JavaScript, Shen,
// Prolog, SASS, HAML, CoffeeScript, and LiveScript.

goog.provide('wonderscript');
goog.provide('wonderscript.helpers');
goog.require('wonderscript.types');
goog.require('wonderscript.edn');

if ( typeof module !== 'undefined' && module.exports ) {
  module.exports = wonderscript;
}

goog.scope(function() {
  
  var ws = wonderscript;
  var t = ws.types;
  var h = ws.helpers;
  var end = ws.edn;
  
  // Symbol -> Symbol
  ws.name = function(sym) {
    return sym.name();
  };
  
  // Symbol -> Symbol
  ws.ns = function(sym) {
    return sym.ns();
  };
  
  // Object -> Boolean
  ws.isSymbol = function(obj) {
    return obj instanceof ws.Symbol;
  };
  
  // String -> Symbol
  ws.symbol = function(str) {
    return new Symbol(str);
  };
  
  // JsValue -> Boolean
  ws.exists = function(val) {
    return typeof val !== 'undefined';
  };
  
  // JsValue -> Array
  ws.toArray = function(val) {
    if ( !ws.exists(val.length) ) return [val];
    else {
      var newA = [], i = 0;
      for (; i < val.length; ++i) {
        newA.push(val[i]);
      }
      return newA;
    }
  };
  
  // JsValue -> String
  ws.toString = function(val) {
    return ""+val;
  };
  
  // Collection -> Collection
  ws.cat = function() {
    var args = ws.toArray(arguments);
    return args[0].cat.apply(args[0], args.slice(1, args.length));
  };
  
  ws.nth = function(coll, n) {
    if ( ws.exists(coll.nth) ) return coll.nth(n);
    else {
      return coll[n];
    }
  };
  
  ws.get = function(coll, k) {
    if ( ws.exists(coll.get) ) return coll.get(k);
    else {
      return coll[k];
    }
  };
  
  // Collection -> JsValue -> Boolean
  ws.has = function(coll, k) {
    if ( ws.exists(coll.has) ) return coll.has(k);
    else {
      return !!coll[k];
    }
  };
  
  // [Object] -> String
  ws.str = function() {
    if ( arguments.length === 0 ) return "";
    else if ( arguments.length === 1 ) return ""+arguments[0];
    else {
      var buffer = [], i;
      for (i = 0; i < arguments.length; ++i) {
        buffer.push(arguments[i]);
      }
      return buffer.join('');
    }
  };

  // Array -> Array
  ws.pair = function(a) {
    var i, pairs = [], pair = [];
    for (i = 0; i < a.length; ++i) {
      if ( i % 2 === 0 ) {
        pair.push(a[i]);
      }
      else {
        pair.push(a[i]);
        pairs.push(pair);
        pair = []
      }
    }
    return pairs;
  };

  // Array -> Function -> Array
  ws.map = function(a, fn) {
    var newA = [], i;
    for (i = 0; i < a.length; ++i) {
      newA.push(fn.call(null, a[i], i));
    }
    return newA;
  };
  
  // Array -> Function -> Array
  ws.mapcat = function(a, fn) {
    var a = ws.map(a, fn)
      , newA = []
      , i;
    for (i = 0; i < a.length; ++i) {
      newA = newA.concat(a[i]);
    }
    return newA;
  };

  // Array -> Function -> Array
  ws.filter = function(a, fn) {
    var i, newA = [];
    for (i = 0; i < a.length; ++i) {
      if ( fn.call(null, a[i], i) ) newA.push(a[i]);
    }
    return newA;
  };

  // Array -> Function -> JsValue
  // Array -> Function -> JsValue -> JsValue
  ws.reduce = function(a, fn, memo) {
    var i;
    for (i = 0; i < a.length; ++i) {
      if ( typeof memo === 'undefined' && i === 0 ) memo = a[i];
      else memo = fn.call(null, memo, a[i]);
    }
    return memo;
  };

  // Array -> JsValue
  ws.min = function(a) {
    return ws.reduce(a, function(memo, n) {
      return memo < n ? memo : n;
    });
  };

  // Array -> JsValue
  ws.max = function(a) {
    return ws.reduce(a, function(memo, n) {
      return memo > n ? memo : n;
    });
  };

  // Object -> String -> JsValue -> Object
  ws.assoc = function(obj, key, value) {
    var newObj = {}, k;
    for (k in obj) {
      newObj[k] = obj[k];
    }
    newObj[key] = value;
    return newObj;
  };
  
  ws.pprint = function(form) {
    return ws.compileFromAst(ws.readFromJs(form), {}, {skipAnalysis: true});
  };

  // Object -> Object
  ws.merge = function(o1, o2) {
    var o = {}, k;
    for ( k in o1 ) o[k] = o1[k];
    for ( k in o2 ) o[k] = o2[k];
    return o;
  };

  // Array -> Function -> Boolean
  ws.any = function(a, fn) {
    return ws.filter(a, fn).length !== 0;
  };

  // Array -> Array
  ws.uniq = function(a) {
    var set = ws.reduce(a, function(memo, n) {
      var o = {};
      if ( !memo[n] ) {
        o[n] = true;
        return ws.merge(memo, o);
      }
      return memo;
    }, {});

    var newA = [], k;
    for ( k in set ) newA.push(k);
    return newA;
  };
  
  // API
  // ===
  
  Array.prototype.apply = function(that, args) {
    var args = args || [];
    return this[args[0]];
  };

  ws.read = ws.edn.read;

  // JsValue -> JsValue
  ws.eval = function(form) {
    return eval(ws.emit(form));
  };

  // Function -> Array -> JsValue
  ws.apply = function(fn, args) {
    if ( fn.apply ) return fn.apply(null, args);
    else throw new Error(ws.str("'", fn, "' is not a function"));
  };

  var XFORMERS = {};

  // JsValue -> String
  ws.emit = function(form) {
    var value, i, key, env = env || ws, opts = opts || {};
    if ( typeof form === 'string' ) {
      var xf = XFORMERS[form];
      if ( xf && xf instanceof Function ) return ws.emit(xf(form));
      else if ( /^(:|'|`)/.test(form) ) return JSON.stringify(form.replace(/^(:|'|`)/, ''));
      else if ( /^".*"$/.test(form) ) return form;
      // fractions
      else if ( /^\d+\/\d+$/.test(form) ) {
        var res = /^(\d+)\/(\d+)/.exec(form);
        return new ws.Rat(1*res[1], 1*res[2]);
      }
      // percentages
      else if ( /^([\d\.]+)%$/.test(form) ) {
        var res = /^([\d\.]+)%$/.exec(form);
        return new ws.Rat(1*res[1], 100);
      }
      else if ( ws[form] ) return ws.str('wonderscript["', form, '"]');
      return form;
    }
    else if ( typeof form === 'boolean' ) return form;
    else if ( form === null ) return 'null';
    else if ( typeof form === 'undefined' ) return 'undefined';
    else if ( form instanceof Date ) return ws.str('new Date(', form.valueOf(), ')');
    else if ( form instanceof RegExp ) {
      var flags = [];
      if ( form.ignoreCase ) flags.push('i');
      if ( form.global ) flags.push('g');
      if ( form.multiline ) flags.push('m');
      return ws.str('/', form.source, '/', flags.join(''));
    }
    else if ( form instanceof Array && (!form.type || form.type === 'list') ) {
      switch(form[0]) {
        case 'if':
          return emitIf(form, env, opts);
        case 'cond':
          return emitCond(form, env, opts);
        case '?':
          return emitExistential(form, env, opts);
        /*case 'null?':
          return emitNullTest(form, env, opts);*/
        case 'instance?':
          return ws.str(ws.emit(form[1]), ' instanceof ', ws.emit(form[2]));
        case 'type':
          return ws.str('typeof ', ws.emit(form[1]));
        case 'js':
          return form[1];
        case 'def':
          return emitDef(form, env, opts);
        case 'fn':
          return emitFunc(form, env, opts);
        case 'define-syntax':
          if ( form.length !== 3 ) throw new Error("define-syntax malformed");
          XFORMERS[form[1]] = ws.eval(form[2]);
          return "";
        case 'loop':
          // TODO
        case 'again':
          // TODO
        case 'throw':
          return ws.str("(function(){ throw ", ws.emit(form[1]), '}())');
        case 'try':
          // TODO
        case 'catch':
          // TODO
        case 'do':
          return emitDo(form, env, opts);
        // object property resolution
        case '.-':
          return emitObjectRes(form);
        // object method call
        case '.':
          return emitMethodCall(form);
        case 'new':
          return emitClassInit(form);
        case 'set!':
          return emitAssignment(form);
        // binary operators
        // TODO: get a complete list of JavaScript's binary operators
        // TODO: add urnary operators also
        case 'not':
          return ws.str('!(', ws.emit(form[1]), ')');
        case 'or':
          return emitBinOperator(['||'].concat(form.slice(1)), env, opts);
        case 'and':
          return emitBinOperator(['&&'].concat(form.slice(1)), env, opts);
        case 'bit-or':
          return emitBinOperator(['|'].concat(form.slice(1)), env, opts);
        case 'bit-and':
          return emitBinOperator(['&'].concat(form.slice(1)), env, opts);
        case 'bit-shift-left':
          return emitBinOperator(['<<'].concat(form.slice(1)), env, opts);
        case 'bit-shift-right':
          return emitBinOperator(['<<'].concat(form.slice(1)), env, opts);
        case '+':
        case '-':
        case '/':
        case '*':
        case '==':
        case '!=':
        case '===':
        case '!==':
          return emitBinOperator(form, env, opts);
        case 'quote':
          return JSON.stringify(form[1]);
        case 'comment':
          return null;
        default:
          var xf = XFORMERS[form[0]];
          if ( xf && xf instanceof Function ) return ws.emit(xf(form));
          return emitFuncApplication(form, env, opts);
      }
    }
    else if ( typeof form === 'object' && form.toSource ) return form.toSource();
    /*else if ( typeof form[0] === 'object' ) {
      return emitFuncApplication(form, env, opts);
    }*/
    else {
      return JSON.stringify(form);
    }
  };
  
  function emitIf(form, env, opts) {
    var pred = ws.emit(form[1], env, opts)
      , cons = ws.emit(form[2], env, opts)
      , alt;
    
    if ( typeof form[3] !== 'undefined' ) alt = ws.emit(form[3], env, opts);
  
    if ( !alt ) {
      return ws.str("(function(){ if ( ", pred, " ) { return ", cons, " }}())");
    }
    else {
      return ws.str("(function(){ if ( ", pred, " ) { return ", cons, " } else { return ", alt, " }}())");
    }
  }

  function emitCond(form) {
    var exprs = ws.pair(form.slice(1))
      , i
      , cond
      , buff = [];
    for (i = 0; i < exprs.length; ++i) {
      cond = i === 0 ? 'if' : 'else if';
      if ( exprs[i][0] === 'else' )
        buff.push(ws.str('else { return ', ws.emit(exprs[i][1]), ' }')); 
      else
        buff.push(ws.str(cond, '(', ws.emit(exprs[i][0]), '){ return ', ws.emit(exprs[i][1]), ' }')); 
    }
    return ws.str('(function(){ ', buff.join(' '), '}())');
  }
  
  function emitExistential(form, env, opts) {
    var val = ws.emit(form[1], env, opts);
    return ws.str("(", ws.emit(val), " != null)");
  }

  function emitNullTest(form, env, opts) {
    var val = ws.emit(form[1], env, opts);
    return ws.str("(", symbolize(val), " === null)");
  }
  
  function emitDef(form, env, opts) {
    var name = form[1]; // TODO: do something to permit lispy naming
    if ( form[2] )
      return ws.str("var ", name, " = ", ws.emit(form[2], env), ";");
    else
      return ws.str("var ", name, ";");
  }

  function emitAssignment(form, env, opts) {
    var name = form[1]; // TODO: do something to permit lispy naming
    return ws.str(ws.emit(name), " = ", ws.emit(form[2], env), ";");
  }

  function parseArgs(args) {
    var splat = false, name, argsBuf = [];
    for (var i = 0; i < args.length; ++i) {
      if ( /^&/.test(args[i]) ) {
        name = args[i].replace(/^&/, '')
        splat = true;
      }
      else {
        name = args[i];
      }
      argsBuf.push({name: name, order: i, splat: splat});
    }
    return argsBuf;
  }

  function genArgAssigns(argsBuf) {
    var argsAssign = [], i;
    for (i = 0; i < argsBuf.length; ++i) {
      if ( argsBuf[i].splat )
        argsAssign.push(ws.str(argsBuf[i].name, " = Array.prototype.slice.call(arguments, ", i, ");"));
      else
        argsAssign.push(ws.str(argsBuf[i].name, " = arguments[", argsBuf[i].order, "];"));
    }
    return argsAssign.join('');
  }

  function genArgsDef(argsBuf) {
    var argsDef = [];
    for (var i = 0; i < argsBuf.length; ++i) {
      argsDef.push(argsBuf[i].name);
    }
    return argsDef.join(',');
  }

  function emitFunc(form, env, opts) {
    var env = env || {}
      , args = form[1]
      , argsDef = []
      , argsAssign = []
      , argsBuf = []
      , expr
      , i
      , value;

    if ( form.length < 3 ) throw new Error("a function requires at least an arguments list and a body");

    if ( form.length === 3 ) {
      if ( !args ) throw new Error("an arguments list is required");

      argsBuf = parseArgs(args);
      argsAssign = genArgAssigns(argsBuf);
      argsDef = genArgsDef(argsBuf);
  
      expr = ws.emit(form[2], env, opts);
      if ( args.length === 0 ) {
        return ws.str("(function(", argsDef, ") { return ", expr, " })");
      }
      else {
        return ws.str("(function(", argsDef, ") { var ", argsDef, ';', argsAssign, " return ", expr, " })");
      }
    }
    else {
      var pairs = ws.pair(form.slice(1));
      args = parseArgs(ws.uniq(ws.mapcat(pairs, function(pair, i){ return pair[0] })));
      argsAssign = genArgAssigns(args);
      argsDef = genArgsDef(args);
      var code = ws.map(pairs, function(pair, i) {
        var args = parseArgs(pair[0])
          , expr = ws.emit(pair[1])
          , cond = i === 0 ? 'if' : 'else if'
          , cmp = ws.any(args, function(arg){ return arg.splat }) ? '>=' : '===';

        return ws.str(cond, ' ( arguments.length ', cmp, ' ', args.length, ' ) { return ', expr, ' }');
      }).concat(['else { throw new Error("wrong number of arguments") }']).join(' ');

      return ws.str('(function(){ var ', argsAssign, code, ' })');
    }
  }

  function emitDo(form) {
    var exprs = form.slice(1), i, buf = [];
    for (i = 0; i < exprs.length; ++i) {
      buf.push(ws.emit(exprs[i]));
    }
    return ws.str("(function(){", buf.slice(0, buf.length-1).join(''), '; return ', buf[buf.length-1], "; }())");
  }

  function emitObjectRes(form) {
    var obj = form[1]
      , prop = form[2]
    return ws.str('(', ws.emit(obj), ')["', prop, '"]');
  }

  function emitMethodCall(form) {
    return ws.str(emitObjectRes(form), '(', form.slice(3).join(', '), ')');
  }

  function emitClassInit(form) {
    var args = ws.map(form.slice(2), function(arg){ return ws.emit(arg) }).join(', ');
    return ws.str('new ', ws.emit(form[1]), '(', args, ')');
  }
  
  function emitFuncApplication(form, env, opts) {
    var fn = ws.emit(form[0], env)
      , args = form.slice(1, form.length)
      , argBuffer = [], i, value;
  
    for (i = 0; i < args.length; ++i) {
      value = ws.emit(args[i], env, opts);
      argBuffer.push(value);
    }
  
    if ( argBuffer.length === 0 ) {
      return ws.str('(', fn, ').apply()');
    }
    return ws.str('(', fn, ').apply(null, [', argBuffer.join(', ') ,"])");
  }
  
  function emitBinOperator(form, env, opts) {
    var op = form[0]
      , values = form.slice(1, form.length)
      , valBuffer = [], i;
    for (i = 0; i < values.length; ++i) {
      valBuffer.push(ws.emit(values[i], env, opts));
    }
    return ws.str('(', valBuffer.join(op), ')');
  }

  // boolean aliases
  ws.eval(['define-syntax', 'on', ['fn', ['form'], 'true']]);
  ws.eval(['define-syntax', 'yes', ['fn', ['form'], 'true']]);
  ws.eval(['define-syntax', 'true', ['fn', ['form'], 'true']]);
  ws.eval(['define-syntax', 'off', ['fn', ['form'], 'false']]);
  ws.eval(['define-syntax', 'no', ['fn', ['form'], 'false']]);
  ws.eval(['define-syntax', 'false', ['fn', ['form'], 'false']]);

  // yada yada
  ws.eval(['define-syntax', '...', ['fn', ['form'], ['throw', ['new', 'Error', '"not implemented"']]]]);

  // JS aliases
  ws.eval(
      ['define-syntax', 'function',
        ['fn', ['form'],
          ['array', ['quote', 'fn'], ['form', 1], ['form', 2]]]]);

  ws.eval(
      ['define-syntax', 'var',
        ['fn', ['form'],
          ['array', ['quote', 'def'], ['form', 1], ['form', 2]]]]);

  ws.cons = function(a, list) {
    return [a].concat(list);
  };

  ws.eval(
      ['define-syntax', 'let',
        ['fn', ['form'], 'form']]);
          

  ws['null?'] = ws.eval(['fn', ['x'], ['===', 'null', 'x']]);
  ws['object?'] = ws.eval(['fn', ['x'], ['===', ['type', 'x'], '`object']]);
  ws['primitive?'] = ws.eval(['fn', ['x'], ['!==', ['type', 'x'], '`object']]);

  ws['+'] = ws.eval(
    ['fn', [], 0,
           ['x'], 'x',
           ['x', '&xs'], ['eval', ['cons', '`+', ['cons', 'x', 'xs']]]]);

  ws['-'] = ws.eval(
    ['fn', [], 0,
           ['x'], 'x',
           ['x', '&xs'], ['eval', ['cons', '`-', ['cons', 'x', 'xs']]]]);

  ws['*'] = ws.eval(
    ['fn', [], 1,
           ['x'], 'x',
           ['x', '&xs'], ['eval', ['cons', '`*', ['cons', 'x', 'xs']]]]);

  ws['/'] = ws.eval(
    ['fn', [], 1,
           ['x'], 'x',
           ['x', '&xs'], ['eval', ['cons', '`/', ['cons', 'x', 'xs']]]]);

  ws['now'] = ws.eval(['fn', [], ['new', 'Date']]);
  ws['toDay'] = ws.eval(
      ['fn', ['d'],
        ['new', 'Date', ['.', 'd', 'getUTCFullYear'],
                        ['.', 'd', 'getUTCMonth'],
                        ['.', 'd', 'getUTCDate']]]);

  ws['today'] = ws.eval(['fn', [], ['toDay', ['now']]]);
  
  ws['range'] = function() {
    var start = 0, stop, step = 1, a = [], i;
    if ( arguments.length === 0 ) return [];
    else if ( arguments.length === 1 ) {
      stop = arguments[0];
    }
    else if ( arguments.length === 2 ) {
      start = arguments[0];
      stop = arguments[1];
    }
    else if ( arguments.length === 3 ) {
      start = arguments[0];
      stop = arguments[1];
      step = arguments[2];
    }
    else {
      throw new Error(ws.str("wrong number of arguments, got ", arguments.length));
    }

    for (i = start; i <= stop; i += step) {
      a.push(i);
    }

    return a;
  };


  /*
   * TODO: Macros
   *
   * defn
   * let
   * ->      Piping ala Clojure
   * ->>
   * .?      Null safe object resolution
   * .method Method Calls
   * .-prop  Object property access
   * ..      Method Chaining
   * ..-     Property Chaining
   * ..?     Null safe object Chaining
   *
   */
});
