goog.provide('wonderscript.types');

if ( module && module.exports ) {
  module.exports = wonderscript.types
}

goog.scope(function() {

  var ws = wonderscript;
  var t = wonderscript.types;
  var DOC_FIELD_NAME = 'ws$lang$doc';
  var NAME_FIELD_NAME = 'ws$lang$name';

  var hashCode = function(val) {
    var hash = 0
      , off = -1
      , i = 0
      , len = val.length;
    
    if ( hash === 0 ) {
      for (; i < len; ++i) {
        hash = 31*hash + val.charCodeAt(++off);
      }
    }
    return hash;
  };

  ws.type = function() {
    var doc, fields, protocol, impl, required = [], f, v;
    if ( arguments.length === 4 ) {
      doc = arguments[0];
      fields = arguments[1];
      protocol = arguments[2];
      impl = arguments[3];
    }
    else if ( arguments.length === 3 ) {
      if ( typeof arguments[0] === 'string' ) {
        doc = arguments[0];
        fields = arguments[1];
        impl = arguments[2];
      }
      else {
        fields = arguments[0];
        protocol = arguments[1];
        impl = arguments[2];
      }
    }
    else if ( arguments.length === 2 ) {
      if ( typeof arguments[0] === 'string' ) {
        doc = arguments[0];
        fields = arguments[1];
      }
      else {
        fields = arguments[0];
        impl = arguments[1];
      }
    }
    else if ( arguments.length === 1 ) {
      fields = arguments[0];
    }
    else {
      throw new Error("a field list is required");
    }

    var ctr = function() {
      var i;
      if ( arguments.length !== fields.length ) {
        throw new Error("Wrong number of arguments expecting " + fields.length + " but got " + arguments.length);
      }
      for (i = 0; i < fields.length; ++i) {
        this[fields[i]] = arguments[i];
      }
    };

    if ( doc ) ctr.$wonderscript$doc = doc;
  
    if ( protocol ) {
      for ( f in protocol ) {
        if ( protocol[f] === 'required' ) required.push(f);
        else {
          ctr.prototype[f] = protocol[f];
        }
      }
    }
  
    if ( impl ) {
      for ( f in impl ) {
        if ( impl[f] instanceof Function ) {
          // TODO: there should be a better way of doing this, but Function#bind didn't seem to work
          (function(){
          var name = f;
          ctr.prototype[f] = function() {
            var i, args = [this];
            for (i = 0; i < arguments.length; ++i) {
              args.push(arguments[i]);
            }
            return impl[name].apply(null, args);
          };
          }());
        }
        else {
          ctr.prototype[f] = impl[f];
        }
      }
    }

    for (i = 0; i < required.length; ++i) {
      if ( !ctr.prototype[required[i]] ) throw new Error("" + required[i] + " is required");
    }
  
    return ctr;
  };

  ws.init = function(ctr, args) {
    var args = [{}].concat(args), i;
    return new (ctr.bind.apply(ctr, args));
  };

  ws.initializer = function() {
    var ctr = arguments[0];
    return function(args) {
      var args = [{}].concat(args);
      return new (ctr.bind.apply(ctr, args));
    };
  };

  ws.record = function() {
    var t = ws.type.apply(null, arguments);
    return t;
  };

  ws.extend = function(o1, o2) {
    var f;
    for ( f in o2 ) {
      if ( typeof o1[f] !== 'undefined' && o1[f] !== 'required' ) throw new Error("'" + f + "' is already defined");
      o1[f] = o2[f];
    }
    return o1;
  };

  ws.protocol = function() {
    var doc, protos, f, i, proto = {}, spec = {}, keys = [];
    if ( arguments.length > 2 ) {
      doc = arguments[0];
      for (i = 1; i < arguments.length; ++i) {
        ws.extend(spec, arguments[i]);
      }
    }
    else if ( arguments.length === 2 ) {
      doc = arguments[0];
      spec = arguments[1];
    }
    else if ( arguments.length === 1 ) {
      spec = arguments[0];
    }

    if ( typeof spec === 'undefined' || typeof spec === 'string' ) {
      throw new Error("a spec is required for a protocol");
    }

    if ( doc ) proto.$wonderscript$doc = doc;

    for ( f in spec ) {
      keys.push(f);
      if ( spec[f] instanceof Function ) {
        // TODO: there should be a better way of doing this, but Function#bind didn't seem to work
        (function(){
        var name = f;
        proto[name] = function() {
          var i, args = [this];
          for (i = 0; i < arguments.length; ++i) {
            args.push(arguments[i]);
          }
          return spec[name].apply(null, args);
        };
        }());
      }
      else {
        proto[f] = spec[f];
      }
    }

    return proto;
  };

  ws.method = function() {

  };
  
  ws.isA = function(child, par) {
    
  };
  
  ws.instanceOf = function(val, klass) {
    if ( typeof val === 'object' ) return val instanceof klass;
    else {
      return typeof val === klass;
    }
  };
  ws['instance?'] = ws.instanceOf;

  ws.gcd = function(a, b) {
    if ( a === 0 && b === 0 ) return 0;
    else if ( a === 0 ) return b;
    else if ( b === 0 ) return a;
    else if ( (a % 2 === 0) && (b % 2 === 0) ) {
      return 2 * ws.gcd(a/2, b/2);
    }
    else if ( a % 2 === 0 ) {
      return ws.gcd(a/2, b);
    }
    else if ( b % 2 === 0 ) {
      return ws.gcd(a, b/2);
    }
    else if ( (a % 2 !== 0) && (b % 2 !== 0) ) {
      if ( a >= b ) return ws.gcd((a - b)/2, b);
      return ws.gcd((b - a)/2, a);
    }
    console.warn("gcd: failed to find gcd, defaulting to 1");
    return 1;
  };

  ws.lcm = function(a, b) {
    return Math.abs(a * b) / ws.gcd(a, b);
  };

  function simplifyRat(rat) {
    
  };

  t.INumeric = ws.protocol({
    add: 'required',
    sub: 'required',
    mult: 'required',
    div: 'required',
    eq: 'required',
    add1: function(n) { return n.add(1) },
    sub1: function(n) { return n.sub(1) }
  });

  ws.add = function(a, b) {
    if ( typeof a === 'number' && typeof b === 'number' ) return a + b;
    else if ( typeof a === 'number' ) return b.add(a);
    else if ( typeof b === 'number' ) return a.add(b);
    return a.add(b)
  };
  ws['+'] = ws.div;

  ws.mult = function(a, b) {
    if ( typeof a === 'number' && typeof b === 'number' ) return a * b;
    else if ( typeof a === 'number' ) return b.mult(a);
    else if ( typeof b === 'number' ) return a.mult(b);
    return a.mult(b)
  };
  ws['*'] = ws.mult;

  ws.sub = function(a, b) {
    if ( typeof a === 'number' && typeof b === 'number' ) return a - b;
    else if ( typeof a === 'number' ) return a - b.toNumber();
    else if ( typeof b === 'number' ) return a.sub(b);
    return a.sub(b)
  };
  ws['-'] = ws.sub;

  ws.div = function(a, b) {
    if ( typeof a === 'number' && typeof b === 'number' ) return new t.Rat(a, b);
    else if ( typeof a === 'number' ) return new t.Rat(a, 1).div(b);
    else if ( typeof b === 'number' ) return a.div(b);
    return a.div(b)
  };
  ws['/'] = ws.div;

  ws.add1 = function(n) { return ws.add(n, 1) };
  ws.sub1 = function(n) { return ws.sub(n, 1) };
  ws.eq = function(a, b) {
    if ( a.eq ) return a.eq(b);
    else {
      return a === b;
    }
  };
  ws['='] = ws.eq;

  t.Rat = ws.type(
    "An implementation of a rational numeric type",
    ['m', 'n'],
    t.INumeric,
    {add:
      function(a, b) {
        // rational
        if ( b instanceof t.Rat ) {
          if ( a.n === b.n ) return new t.Rat(a.m + b.m, a.n);
          else {
            var n = ws.lcm(a.n, b.n)
              , Ma = (n / a.n) * a.m
              , Mb = (n / b.n) * b.m;
            return new t.Rat(Ma + Mb, n);
          }
        }
        // integer
        else if ( b % 1 === 0 ) return a.add(new t.Rat(b, 1));
        // float
        else if ( typeof b === 'number' ) return a.toNumber() + b;
        else {
          throw new Error("invalid type '" + b + "' is not a number");
        }
      },
     sub:
       function(a, b) {
         // rational
         if ( b instanceof t.Rat ) {
           if ( a.n === b.n ) return new t.Rat(a.m - b.m, a.n);
           else {
             var n = ws.lcm(a.n, b.n)
               , Ma = (n / a.n) * a.m
               , Mb = (n / b.n) * b.m;
             return new t.Rat(Ma - Mb, n);
           }
         }
         // integer
         else if ( b % 1 === 0 ) return a.sub(new t.Rat(b, 1));
         // float
         else if ( typeof b === 'number' ) return a.toNumber() - b;
         else {
           throw new Error("invalid type '" + b + "' is not a number");
         }
       },
     mult:
       function(a, b) {
         if ( b instanceof t.Rat ) {
           return new t.Rat(a.m * b.m, a.n * b.n);
         }
         else if ( b % 1 === 0 ) return new t.Rat(a.m * b, a.n);
         else if ( typeof b === 'number' ) return a.toNumber() * b;
         else {
          throw new Error("invalid type '" + b + "' is not a number");
         }
       },
     invert: function(r) { return new t.Rat(r.n, r.m) },
     div:
       function(a, b) {
         if ( b instanceof t.Rat ) {
           return b.invert().mult(a);
         }
         else if ( b % 1 === 0 ) return new t.Rat(1, b).mult(a);
         else if ( typeof b === 'number' ) return a.toNumber() / b;
         else {
          throw new Error("invalid type '" + b + "' is not a number");
         }
       },
     eq:
       function(a, b) {
         if ( b instanceof t.Rat ) {
           return a.m === b.m && a.n === b.n;
         }
         else if ( b % 1 === 0 ) return a.m === b && a.n == 1;
         else if ( typeof b === 'number' ) return a.toNumber() === b;
         else {
          throw new Error("invalid type '" + b + "' is not a number");
         }
       },
     denominator: function(r) { return r.n },
     numerator: function(r) { return r.m },
     //toString: function(r) { return "" + r.m + "/" + r.n },
     toString: function(r) { return "new wonderscript.types.Rat(" + r.m + ", " + r.n + ")" },
     toSource: function(r) { return "new wonderscript.types.Rat(" + r.m + ", " + r.n + ")" },
     toNumber: function(r) { return r.m / r.n }
  });

  t.ISeq = ws.protocol({
    cons: 'required',
    conj: 'required',
  });

  ws.cons = function(v, seq) {
    if ( seq instanceof Array ) return [v].concat(seq);
    return seq.cons(v)
  };

  ws.conj = function(seq, v) {
    if ( seq instanceof Array ) return seq.concat([v]);
    return seq.conj(v)
  };

  t.IMapable = ws.protocol({
    get: 'required',
    entries: 'required',
    has: function(m, k) { return !!m.get(k) },
    keys: function(m) {
      return m.entries().map(function(x){ return x[0] });
    },
    values: function(m) {
      return m.entries().map(function(x){ return x[1] });
    }
  });

  ws.get = function(m, k) { return m.get(k) };
  ws.has = function(m, k) { return m.has(k) };
  ws.keys = function(m) { return m.keys() };
  ws.values = function(m) { return m.values() };
  ws.entries = function(m) { return m.entries() };

  t.ICollection = ws.protocol({
    nth: 'required',
    each: 'required',
    isEmpty: 'required'
  });

  ws.nth = function(col, n) {
    if ( col instanceof Array ) return col[n];
    return col.nth(n);
  };

  ws.first = function(col) {
    if ( col instanceof Array ) return col[0];
    return col.first()
  };

  ws.second = function(col) {
    if ( col instanceof Array ) return col[1];
    return col.second();
  };

  ws.third = function(col) {
    if ( col instanceof Array ) return col[2];
    return col.third();
  };

  ws.forth = function(col) {
    if ( col instanceof Array ) return col[3];
    return col.forth();
  };

  ws.isEmpty = function(col) { return col.length === 0 || col.isEmpty() };
  ws.count = function(col) {
    return (typeof col.length !== 'undefined' && col.length) || col.count();
  };

  ws.last = function(col) {
    if ( col instanceof Array ) return col[col.length - 1];
    return col.last();
  };

  ws.rest = function(col) {
    if ( col instanceof Array ) return col.slice(1, col.length);
    return col.rest();
  };

  ws.toArray = function(obj) {
    var a = [], i = 0;
    for (; i < obj.length; ++i) {
      a.push(obj[i]);
    }
    return a;
  };

  ws.array = function() {
    return Array.prototype.slice.call(arguments);
  };

  ws.each = function(col, fn) {
   if ( col.each ) return col.each(fn);
   else {
     var i, len = ws.count(col);
     for (i = 0; i < len; ++i) {
       fn.call(null, col[i]);
     }
     return col;
   }
  };

  ws.concat = function(a, b) {
    if ( arguments.length === 2 ) return a.concat(b)
    else if ( arguments.length > 2 ) {
      var args = ws.cons(a.concat(b), ws.drop(ws.toArray(arguments), 2));
      return ws.concat.apply(null, args);
    }
    throw new Error("2 arguments are required received " + arguments.length);
  };

  ws.drop = function(col, n) {
    if ( n === 0 ) return col;
    else if ( n === 1 ) return ws.rest(col);
    else {
      return ws.drop(ws.rest(col), n - 1);
    }
  };

  ws.take = function(col, n) {
    if ( n === 0 ) return [];
    else if ( n === 1 ) return [ws.first(col)];
    else {
      return [ws.first(col)].concat(ws.take(ws.rest(col), n - 1));
    }
  };

  ws.map = function(fn, col) {
    var a = [];
    ws.each(col, function(v) {
      a.push(fn.call(null, v));
    });
    return a;
  };

  ws.mapcat = function(fn, col) {
    return ws.concat.apply(null, ws.map(fn, col));
  };

  ws.filter = function(fn, col) {
    var a = [];
    ws.each(col, function(v) {
      if ( fn.call(null, v) ) a.push(v);
    });
    return a;
  };

  ws.reduce = function() {
    var fn, val, col, i = 0;
    if ( arguments.length === 3 ) {
      fn = arguments[0];
      val = arguments[1];
      col = arguments[2];
    }
    else if ( arguments.length === 2 ) {
      fn = arguments[0];
      col = arguments[2];
    }
    else {
      throw new Error("wrong number of arguments");
    }

    ws.each(col, function(v) {
      if ( typeof val === 'undefined' ) {
        var val = v;
      }
      else {
        val = fn.call(null, v);
      }
    });
    return val;
  };

  ws.hashCode = function(val) {
    if ( typeof val.hashCode !== 'undefined' ) return val.hashCode();
    else {
      return hashCode(val);
    }
  };

  t.ISymbolic = ws.protocol(
    {hashCode: 
       function(sym) {
         console.log('ISymbolic sym:', sym);
         console.log(sym.value);
         if ( typeof sym.$hashCode === 'undefined' ) {
           sym.$hashCode = hashCode(sym.value);
         }
         return sym.$hashCode;
       },
     eq:
       function(a, b) {
         if ( b.hashCode ) return a.hashCode() === b.hashCode();
         return false;
       }
  });

  t.ISymbol = ws.protocol("", t.ISymbolic, t.IMapable, t.ICollection, t.ISeq);

  ws.name = function(sym) { return sym.name() };
  ws.ns = function(sym) { return sym.ns() };
  ws.match = function(sym, regex) { return sym.match(regex) };
  ws.replace = function(sym, pat, sub) { return sym.replace(pat, sub) };

  t.Char = ws.type(
    "Charater type",
    ['value'],
    t.ISymbolic,
    {ascii: function(c) { return c.value.charCodeAt(0) },
     uppercase: function(c) { return c.value.toUpperCase() },
     lowercase: function(c) { return c.value.toLowerCase() },
     toString: function(c) { return c.value.toString() }});

  ws.char = ws.initializer(t.Char);

  t.Char.fromAscii = function(code) {
    return new t.Char(String.fromCharCode(code));
  };

  t.Symbol = ws.type(
    "Symbol type",
    ['value'],
    t.ISymbol,
    {ns:
      function(sym) {
        var parts = sym.value.split('/');
        if ( parts.length === 2 ) return new t.Symbol(parts[0]);
        return null;
      },
     name:
       function(sym) {
         var parts = sym.value.split('/');
         if ( parts.length === 2 ) return new t.Symbol(parts[1]);
         return new t.Symbol(parts[0]);
       },
     entries: function(sym) { return ws.map(ws.char, sym.value.split('')) },
     each:
      function(sym, fn) {
        var xs = sym.entries(), i;
        for (i = 0; i < xs.length; ++i) {
          fn.call(null, xs[i], i);
        }
        return sym;
      },
     count: function(sym) { return sym.value.length },
     isEmpty: function(sym) { return sym.value.length === 0 },
     get:
       function(sym, k) {
         if ( typeof sym.$cache === 'undefined' ) {
           sym.$cache = {};
           var xs = sym.entries(), i;
           for (i = 0; i < xs.length; ++i) {
             sym.$cache[ws.hashCode(xs[i])] = true;
           }
         }
         console.log(k);
         console.log(ws.hashCode(k));
         return !!sym.$cache[ws.hashCode(k)] ? k : null;
       },
     apply: function(sym, m) { return ws.get(m, sym) },
     match: function(sym, regex) { return regex.test(sym.value) },
     cons:
       function(sym, val) {
         return new t.Symbol(val.toString() + sym.value)
       },
     conj:
       function(sym, val) {
         return new t.Symbol(sym.value + val.toString())
       },
     nth: function(sym, n) { return sym.value[n] },
     first: function(sym) { return sym.nth(0) },
     second: function(sym) { return sym.nth(1) },
     third: function(sym) { return sym.nth(2) },
     fourth: function(sym) { return sym.nth(3) },
     rest:
       function(sym) {
         var xs = sym.entries();
         return xs.slice(1, xs.length);
       },
     last: function(sym) { return sym.value[sym.value.length - 1] },
     replace:
       function(sym, pat, sub) {
         return new t.Symbol(sym.value.replace(pat, sub.toString()));
       },
     concat: function(a, b) { return new t.Symbol(a.value + b.value) },
     uppercase: function(sym) { return new t.Symbol(sym.value.toUpperCase()) },
     lowercase: function(sym) { return new t.Symbol(sym.value.toLowerCase()) },
     capitalize: function(sym) { return new t.Symbol(sym.first().uppercase() + sym.rest().join('')); },
     valueOf: function(sym) { return sym.value },
     toSource: function(sym) { return "new wonderscript.types.Symbo(" + sym.value + ")" },
     toString: function(sym) { return sym.value.toString() }});

  t.IPersistentList = ws.protocol("", t.ISeq, t.ICollection);

  t.PersistentList = ws.type(
    "PersistentList",
    ['_h', '_t'],
    t.IPersistentList,
    {cons: function(list, head) { return new t.PersistentList(head, list) },
     conj: function(list, head) { return new t.PersistentList(head, list) },
     first: function(list) { return list._h },
     second: function(sym) { return sym.rest().first() },
     third: function(sym) { return sym.rest().rest().first() },
     fourth: function(sym) { return sym.rest().rest().rest().first() },
     rest:
      function(list) {
        if ( list._t === null ) return t.PersistentList.empty();
        return list._t
      },
     peek: function(list) { return list.head },
     pop: function(list) { return list.rest() },
     nth:
      function nth(list, n) {
        if ( n === 0 ) return list.first();
        else {
          return nth(list.rest(), n - 1);
        }
      },
     each:
      function each(list, fn) {
        if ( !list.isEmpty() ) {
          fn.call(null, list.first());
          each(list.rest(), fn);
        }
        return list;
      },
     isEmpty: function(list) { return list.head === null && list.tail === null }});

  t.PersistentList.empty = function() {
    return new t.PersistentList(null, null);
  };

  ws.list = function() {
    var i, l = t.PersistentList.empty();
    for (i = (arguments.length - 1); i > -1; --i) {
      l = l.cons(arguments[i]);
    }
    return l;
  };

  t.IPersistentArrayMap = ws.protocol("", t.IMapable, t.ISeq);

  t.PersistentArrayMap = ws.type(
    "PersistentArrayMap",
    ['rep'],
    {});
});
