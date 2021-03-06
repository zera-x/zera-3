goog.provide('wonderscript.types');

goog.scope(function() {

  var ws = wonderscript;
  var t = wonderscript.types;
  var DOC_FIELD_NAME = '@@doc';
  var NAME_FIELD_NAME = '@@name';

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

    if ( doc ) ctr[DOC_FIELD_NAME] = doc;
  
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
  
    return Object.freeze(ctr);
  };

  ws.dataType = ws.type;

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

    return Object.freeze(proto);
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

  ws.symbol = function(string) {
    var string  = new String(string);
    string.type = "symbol";
    return Object.freeze(string);
  };

  ws.keyword = function(string) {
    var string  = new String(string);
    string.type = "keyword";
    return Object.freeze(string);
  };

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
  ws['+'] = ws.add;

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
    if ( typeof a === 'number' && typeof b === 'number' ) return new ws.Rat(a, b);
    else if ( typeof a === 'number' ) return new ws.Rat(a, 1).div(b);
    else if ( typeof b === 'number' ) return a.div(b);
    return a.div(b)
  };
  ws['/'] = ws.div;

  ws.add1 = function(n) { return ws.add(n, 1) };
  ws.sub1 = function(n) { return ws.sub(n, 1) };

  ws.eq = function(a, b) {
    if ( a == null && b == null ) return true;
    else if ( a == null ) return false;
    else if ( b == null ) return false;
    else if ( a.eq ) return a.eq(b);
    else {
      return ws.hashCode(a) === ws.hashCode(b);
    }
  };
  ws['='] = ws.eq;

  ws.Syntax = ws.type(
    "A syntax object",
    ['form', 'tag', 'line']);

  ws.syntax = function (form, tag, line) {
    return new ws.Syntax(form, tag, line);
  };

  ws.Rat = ws.type(
    "An implementation of a rational numeric type",
    ['m', 'n'],
    t.INumeric,
    {add:
      function(a, b) {
        // rational
        if ( b instanceof ws.Rat ) {
          if ( a.n === b.n ) return new ws.Rat(a.m + b.m, a.n);
          else {
            var n = ws.lcm(a.n, b.n)
              , Ma = (n / a.n) * a.m
              , Mb = (n / b.n) * b.m;
            return new ws.Rat(Ma + Mb, n);
          }
        }
        // integer
        else if ( b % 1 === 0 ) return a.add(new ws.Rat(b, 1));
        // float
        else if ( typeof b === 'number' ) return a.toNumber() + b;
        else {
          throw new Error("invalid type '" + b + "' is not a number");
        }
      },
     sub:
       function(a, b) {
         // rational
         if ( b instanceof ws.Rat ) {
           if ( a.n === b.n ) return new ws.Rat(a.m - b.m, a.n);
           else {
             var n = ws.lcm(a.n, b.n)
               , Ma = (n / a.n) * a.m
               , Mb = (n / b.n) * b.m;
             return new ws.Rat(Ma - Mb, n);
           }
         }
         // integer
         else if ( b % 1 === 0 ) return a.sub(new ws.Rat(b, 1));
         // float
         else if ( typeof b === 'number' ) return a.toNumber() - b;
         else {
           throw new Error("invalid type '" + b + "' is not a number");
         }
       },
     mult:
       function(a, b) {
         if ( b instanceof ws.Rat ) {
           return new ws.Rat(a.m * b.m, a.n * b.n);
         }
         else if ( b % 1 === 0 ) return new ws.Rat(a.m * b, a.n);
         else if ( typeof b === 'number' ) return a.toNumber() * b;
         else {
          throw new Error("invalid type '" + b + "' is not a number");
         }
       },
     invert: function(r) { return new ws.Rat(r.n, r.m) },
     div:
       function(a, b) {
         if ( b instanceof ws.Rat ) {
           return b.invert().mult(a);
         }
         else if ( b % 1 === 0 ) return new ws.Rat(1, b).mult(a);
         else if ( typeof b === 'number' ) return a.toNumber() / b;
         else {
          throw new Error("invalid type '" + b + "' is not a number");
         }
       },
     eq:
       function(a, b) {
         if ( b instanceof ws.Rat ) {
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
     toString: function(r) { return ws.str(r.m, "/", r.n) },
     toSource: function(r) { return "new wonderscript.Rat(" + r.m + ", " + r.n + ")" },
     toNumber: function(r) { return r.m / r.n }
  });

  t.ISeq = ws.protocol({
    cons: 'required',
    conj: 'required'
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

  ws.object = function() {
    if ( arguments.length < 2 ) return {};
    else {
      var pairs = ws.pair(ws.toArray(arguments))
        , i = 0
        , obj = {};
      for (; i < pairs.length; ++i) {
        obj[pairs[i][0]] = pairs[i][1];
      }
      return obj;
    }
  };

  ws.objectMap = function() {
    if ( arguments.length === 0 ) return new ws.ObjectMap([]);
    return new ws.ObjectMap(ws.toArray(arguments));
  };

  ws.ObjectMap = function(rep) {
    var pairs = ws.pair(rep)
      , i = 0;
    for (; i < pairs.length; ++i) {
      this[pairs[i][0]] = pairs[i][1];
    }
    Object.freeze(this);
  }

  ws.ObjectMap.prototype.get = function(key) {
    return this[key];
  };

  ws.ObjectMap.prototype.apply = function(self, args) {
    return this[args[0]];
  };

  ws.ObjectMap.prototype.keys = function() {
    return Object.keys(this);
  };

  ws.ObjectMap.prototype.values = function() {
    return this.entries().map(function(x){ return x[1] });
  };

  ws.ObjectMap.prototype.entries = function() {
    var a = [], i, keys = this.keys();
    for (i = 0; i < keys.length; ++i) {
      if ( this.has(keys[i]) ) a.push([keys[i], this.get(keys[i])]);
    }
    return a;
  };

  ws.ObjectMap.prototype.assoc = function(key, value) {
    var rep = ws.concat.apply(null, this.entries().concat([[key, value]]));
    return new ws.ObjectMap(rep);
  };
  
  ws.ObjectMap.prototype.merge = function(other) {
    var entries = this.entries(), k;
    if ( other.entries ) entries = entries.concat(other.entries());
    else {
      for ( k in other ) entries.push([k, other[k]]);
    }
    return new ws.ObjectMap(ws.concat.apply(null, entries));
  };

  ws.ObjectMap.prototype.has = function(key) {
    return this.hasOwnProperty(key);
  };

  ws.ObjectMap.prototype.hashCode = function() {
    return ws.hashCode(ws.concat(this.keys(), this.values()));
  };

  ws.ObjectMap.prototype.toString = function() {
    return ws.str('{', ws.concat.apply(null, this.entries().map(function(x){ return [JSON.stringify(x[0]), x[1]] })).join(', '), '}');
  };

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
    if ( arguments.length === 0 ) return [];
    else if ( arguments.length === 1 ) return a;
    else if ( arguments.length === 2 ) return a.concat(b)
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


  function hashCodeString(val) {
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
  }

  ws.hashCode = function(val) {
    if ( val == null ) return hashCodeString("symbol$null");
    else if ( typeof val === 'number' && isNaN(val) ) return hashCodeString('symbol$NaN');
    else if ( typeof val === 'number' ) return val;
    else if ( typeof val === 'string' ) return hashCodeString(ws.str('string$', val));
    else if ( val === true ) return hashCodeString('symbol$true');
    else if ( val === false ) return hashCodeString('symbol$false');
    else if ( val instanceof Array ) {
      return ws.reduce(val, function(sum, x){ return sum + ws.hashCode(x) }, 0);
    }
    else if ( typeof val === 'object' && val.hashCode ) {
      return val.hashCode();
    }
    else {
      throw new Error(ws.str("Don't know how to get a hash code for '", val, "'"));
    }
  };

  t.IPersistentList = {}; //ws.protocol("", t.ISeq, t.ICollection);

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

  ws.list = function() {
    var l = ws.array.apply(null, arguments);
    l.type = 'list';
    return Object.freeze(l);
  };

  t.IPersistentArrayMap = {}; //ws.protocol("", t.IMapable, t.ISeq);

  t.PersistentArrayMap = ws.type(
    "PersistentArrayMap",
    ['rep'],
    {});
});
