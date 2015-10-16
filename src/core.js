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

if ( module && module.exports ) {
  module.exports = wonderscript;
}

goog.scope(function() {
  
  var ws = wonderscript;
  var h = ws.helpers;
  
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

  ws.map = function(a, fn) {
    var newA = [], i;
    for (i = 0; i < a.length; ++i) {
      newA.push(fn.call(null, a[i], i));
    }
    return newA;
  };
  
  ws.mapcat = function(a, fn) {
    var a = ws.map(a, fn)
      , newA = []
      , i;
    for (i = 0; i < a.length; ++i) {
      newA = newA.concat(a[i]);
    }
    return newA;
  };

  ws.filter = function(a, fn) {
    var i, newA = [];
    for (i = 0; i < a.length; ++i) {
      if ( fn.call(null, a[i], i) ) newA.push(a[i]);
    }
    return newA;
  };

  ws.reduce = function(a, fn, memo) {
    var i;
    for (i = 0; i < a.length; ++i) {
      if ( typeof memo === 'undefined' && i === 0 ) memo = a[i];
      else memo = fn.call(null, memo, a[i]);
    }
    return memo;
  };

  ws.min = function(a) {
    return ws.reduce(a, function(memo, n) {
      return memo < n ? memo : n;
    });
  };

  ws.max = function(a) {
    return ws.reduce(a, function(memo, n) {
      return memo > n ? memo : n;
    });
  };

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

  ws.merge = function(o1, o2) {
    var o = {}, k;
    for ( k in o1 ) o[k] = o1[k];
    for ( k in o2 ) o[k] = o2[k];
    return o;
  };

  ws.any = function(a, fn) {
    return ws.filter(a, fn).length !== 0;
  };

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
  
  var SYMBOL_STACK = [];
  
  ws.eval = function(form) {
    return eval(ws.emit(form));
  };

  ws.apply = function(fn, args) {
    if ( fn.apply ) return fn.apply(null, args);
    else return fn[args[1]];
  };

  ws.emit = function(form) {
    var value, i, key, env = env || ws, opts = opts || {};
    if ( typeof form === 'string' ) {
      if ( /^(:|'|`)/.test(form) ) return JSON.stringify(form.replace(/^(:|'|`)/, ''));
      else if ( form === 'on' || form === 'yes' ) return 'true';
      else if ( form === 'off' || form === 'no' ) return 'false';
      else if ( /^\d+\/\d+$/.test(form) ) {
        var res = /^(\d+)\/(\d+)/.exec(form);
        return new t.Rat(1*res[1], 1*res[2]);
      }
      else if ( ws[form] ) return ws.str('wonderscript["', form, '"]');
      return form;
    }
    else if ( form instanceof Date ) return ws.str('new Date(', form.valueOf(), ')');
    else if ( form instanceof Array ) {
      if ( typeof form[0] === 'string' ) {
        switch(form[0]) {
          case 'if':
            return emitIf(form, env, opts);
          case 'cond':
            return emitCond(form, env, opts);
          // existential
          case '?':
            return emitExistential(form, env, opts);
          case 'null?':
            return emitNullTest(form, env, opts);
          case 'primitive?':
            // TODO
          case 'object?':
            // TODO
          case 'var':
          case 'def':
            return emitDef(form, env, opts);
          case 'function':
          case 'fn':
            return emitFunc(form, env, opts);
          case 'loop':
            // TODO
          case 'again':
            // TODO
          case 'throw':
            // TODO
          case 'try':
            // TODO
          case 'catch':
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
          /*case '+':
          case '-':
          case '/':
          case '*':*/
          case '&':
          case '|':
          case '&&':
          case '||':
          case '==':
          case '===':
            return emitBinOperator(form, env, opts);
          case 'quote':
            return JSON.stringify(form[1]);
          case 'comment':
            return null;
          default:
            return emitFuncApplication(form, env, opts);
        }
      }
      return JSON.stringify(form);
    }
    else if ( typeof form === 'object' && form.toSource ) return form.toSource();
    else if ( typeof form[0] === 'object' ) {
      return emitFuncApplication(form, env, opts);
    }
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
    
  }
  
  function symbolize(val) {
    if ( typeof val === 'undefined' ) return 'undefined';
    else if ( val === null ) return 'null';
    else {
      return val;
    }
  }

  function emitExistential(form, env, opts) {
    var val = ws.emit(form[1], env, opts);
    return ws.str("(typeof ", symbolize(val), " !== 'undefined')");
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
      return ws.str("(function(", argsDef, ") { var ", argsDef, ';', argsAssign, " return ", expr, " })");
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
    return ws.str(obj, '.', prop);
  }

  function emitMethodCall(form) {
    return emitFuncApplication([emitObjectRes(form)].concat(form.slice(2)));
  }

  function emitClassInit(form) {
    return emitFuncApplication([ws.str('new ', form[1])].concat(form.slice(2)));
  }
  
  function emitFuncApplication(form, env, opts) {
    var fn = ws.emit(form[0], env)
      , args = form.slice(1, form.length)
      , argBuffer = [], i, value;
  
    for (i = 0; i < args.length; ++i) {
      value = ws.emit(args[i], env, opts);
      argBuffer.push(value);
    }
  
    //if ( typeof form[0] === 'object' ) return ws.str('(', fn, ")[", argBuffer.join(''), "]");
  
    if ( argBuffer.length === 0 ) {
      return ws.str('wonderscript.apply(', fn, ")");
    }
    return ws.str('wonderscript.apply(', fn, ", [", argBuffer.join(', ') ,"])");
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

  /*
   * TODO: Macros
   *
   * defn
   * ->      Piping ala Clojure
   * ->>
   * .?      Null safe object resolution
   * .method Method Calls
   * .-prop  Object property access
   * ..      Method Chaining
   * ..-     Property Chaining
   * ..?     Null safe object Chaining
   *
   * TODO: Special Forms
   *
   * let
   *
   * We're going to need a stack for this and for some the the
   * ambiguity resolution needed for symbols / strings.
   *
   * Symbol / String resolution rules
   */
  ws.analyzeAst = function(ast) {
    var res, i, key, value;
    switch(ast.tag) {
      case 'symbol':
  
      case 'List':
      case 'Vector':
      case 'Array':
        value = ast.value;
        // special forms
        if ( value.length > 0 ) {
          if ( value[0].tag === 'symbol' ) {
            switch(value[0].value) {
              case 'if':
                return h.assoc(ast, 'tag', 'if');
              case '?':
                return h.assoc(ast, 'tag', 'existential');
              case 'def':
                return h.assoc(ast, 'tag', 'definition');
              case 'quote':
                return h.assoc(ast, 'tag', 'quote');
              case 'comment':
                return h.assoc(ast, 'tag', 'comment');
              case 'fn':
                return h.assoc(ast, 'tag', 'lambda');
              case '.':
                return h.assoc(ast, 'tag', 'object-resolution');
              case '+':
              case '-':
              case '*':
              case '/':
              case 'or':
              case 'and':
              case 'not':
              case '<':
              case '>':
                return h.assoc(ast, 'tag', 'operator');
              case '=':
                value = value.slice(1, value.length);
                value.unshift({tag: 'symbol', value: '===', form: '='});
                return {tag: 'operator', form: ast.form, value: value};
              default:
                break;
            }
          }
    
          // function application
          if ( value[0].tag === 'Array' || value[0].tag === 'symbol' || value[0].tag === 'keyword' || value[0].tag === 'Map' ) {
            return h.assoc(ast, 'tag', 'application');
          }
          
          if ( value[0].value === '~#' ) {
            return {tag: 'Array', value: value.slice(1, value.length), form: value.form};
          }
        }
        return ast;
      default:
        return ast;
    }
  };
});
