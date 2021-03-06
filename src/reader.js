goog.provide('wonderscript.edn');
goog.require('wonderscript.types');

goog.scope(function () {
  var ws = wonderscript;

  function keyword (string) {
    string      = new String(string);
    string.type = "keyword";

    return ws.str(':', string);
  }

  function symbol (string) {
    string      = new String(string);
    string.type = "symbol";

    return string;
  }

  function vector (array) {
    if (arguments.length != 1 || !(array instanceof Array && !array.type)) {
      array = Array.prototype.slice.call(arguments);
    }

    array.type = "vector";

    return array;
  }

  function map (array) {
    return new ws.ObjectMap(array);
  }

  function list (array) {
    if (arguments.length != 1 || !(array instanceof Array && !array.type)) {
      array = Array.prototype.slice.call(arguments);
    }

    array.type = "list";

    return array;
  }

  function set (array) {
    if (arguments.length != 1 || !(array instanceof Array && !array.type)) {
      array = Array.prototype.slice.call(arguments);
    }

    for (var i = 0; i < array.length; i++) {
      var value = array[i];

      for (var j = 0; j < array.length; j++) {
        if (i !== j && value === array[j]) {
          throw new SyntaxError("the array contains non unique values");
        }
      }
    }

    array.type = "set";

    return array;
  }

  function is_keyword (x) {
    if (x instanceof String && x.type == "keyword") {
      return true;
    }

    return false;
  }

  function is_symbol (x) {
    if (x instanceof String && x.type == "symbol") {
      return true;
    }

    return false;
  }

  function is_list (x) {
    if (x instanceof Array && x.type == "list") {
      return true;
    }

    return false;
  }

  function is_set (x) {
    if (x instanceof Array && x.type == "set") {
      return true;
    }

    return false;
  }

  function is_vector (x) {
    if (x instanceof Array && x.type == "vector") {
      return true;
    }

    return false;
  }

  function rational (string) {
    var res = /^(\d+)\/(\d+)/.exec(string);
    return new ws.Rat(1*res[1], 1*res[2]);
  }

  function is_rational (x) {
    return x instanceof ws.Rat;
  }

  var Printer = (function () {
    function rfc3339 (date) {
      function pad (value, length) {
        var string = value.toString();

        return (new Array(length - string.length + 1).join('0')) + string;
      }

      var offset = date.getTimezoneOffset();
      
      return pad(date.getFullYear(), 4)
        + "-" + pad(date.getMonth() + 1, 2)
        + "-" + pad(date.getDate(), 2)
        + "T" + pad(date.getHours(), 2)
        + ":" + pad(date.getMinutes(), 2)
        + ":" + pad(date.getSeconds(), 2)
        + "." + pad(date.getMilliseconds(), 3)
        + (offset > 0 ? "-" : "+")
        + pad(Math.floor(Math.abs(offset) / 60), 2)
        + ":" + pad(Math.abs(offset) % 60, 2);
    }

    function inspect (string) {
      var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
          meta      = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
          };

      escapable.lastIndex = 0;

      return '"' + (escapable.test(string) ? string.replace(escapable, function (a) {
        var c = meta[a];

        return typeof c === 'string' ? c :
          '\\\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) : string) + '"';
    }

    var c = function (object, options) {
      this.options = options || {};
      this.object  = object;
    }

    c.stringify = function (obj, options) {
      options = options || {};

      if (obj == null) {
        return 'nil';
      }

      switch (typeof obj) {
        case 'boolean': return obj.toString();
        case 'number':  return obj.toString();
        case 'string':  return inspect(obj);
      }
      
      if (obj instanceof String) {
        if (is_keyword(obj)) {
          return ":" + obj.toString();
        }
        else if (is_symbol(obj)) {
          return obj.toString();
        }
        else {
          return inspect(obj.toString());
        }
      }
      else if (obj instanceof Number) {
        return obj.toString();
      }
      else if (obj instanceof Boolean) {
        return obj.toString();
      }
      else if (obj instanceof Array) {
        var result = '';

        for (var i = 0; i < obj.length; i++) {
          result += c.stringify(obj[i], options) + ' ';
        }

        result = result.substr(0, result.length - 1);

        if (is_list(obj)) {
          return '(' + result + ')';
        }
        else if (is_set(obj)) {
          return '#{' + result + '}';
        }
        else {
          return '[' + result + ']';
        }
      }
      else if (obj instanceof RegExp) {
        return '#"' + obj.toString().substr(1).replace(/\/\w*$/, '') + '"';
      }
      else if (obj instanceof Date) {
        if (options.alpha) {
          return '#inst "' + rfc3339(obj) + '"';
        }
        else {
          return parseInt(obj.getTime() / 1000).toString();
        }
      }
      else if (is_rational(obj)) {
        return obj.toString();
      }
      else {
        var result = '';

        for (var key in obj) {
          if (options.keys_are_keywords && typeof key === 'string') {
            key = keyword(key);
          }

          result += c.stringify(key, options) + ' ' + c.stringify(obj[key], options) + ' ';
        }

        return '{' + result.substr(0, result.length - 1) + '}';
      }

      throw new SyntaxError('unknown object');
    }

    c.prototype.show = function () {
      return c.stringify(this.object, this.options);
    }

    return c;
  })();

  var Reader = (function () {
    function unescape (string) {
      var escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
      }

      var position = 0;
      var result   = '';

      while (string[position]) {
        if (string[position] === '\\') {
          position++;

          if (string[position] === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(string[++position], 16);

              if (!isFinite(hex)) {
                break;
              }

              uffff = uffff * 16 + hex;
            }

            result += String.fromCharCode(uffff);
          }
          else if (typeof escapee[string[position]] === 'string') {
            result += escapee[string[position]];
          }
          else {
            break;
          }
        }
        else {
          result += string[position];
        }

        position++;
      }

      return result;
    }

    function rfc3339 (string) {
      var result  = new Date();
      var matches = string.match(/(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/);
      var offset  = 0;

      result.setUTCDate(1);
      result.setUTCFullYear(parseInt(matches[1], 10));
      result.setUTCMonth(parseInt(matches[3], 10) - 1);
      result.setUTCDate(parseInt(matches[5], 10));
      result.setUTCHours(parseInt(matches[7], 10));
      result.setUTCMinutes(parseInt(matches[9], 10));
      result.setUTCSeconds(parseInt(matches[11], 10));

      if (matches[12]) {
        result.setUTCMilliseconds(parseFloat(matches[12]) * 1000);
      }
      else {
        result.setUTCMilliseconds(0);
      }

      if (matches[13] != 'Z') {
        offset  = (matches[15] * 60) + parseInt(matches[17], 10);
        offset *= ((matches[14] == '-') ? -1 : 1);

        result.setTime(result.getTime() - offset * 60 * 1000);
      }

      return result;
    }

    function is_ignored (ch) {
      return ch == null || /[\s,]/.test(ch);
    }

    function is_symbol (ch) {
      // TODO: think about what to do with trailing ':' on symbols, will just let them slide for now
      return /^[a-zA-Z0-9\+\!\-\_\?\.\:\*\/\<\=\%\$\@\~\|\\]$/.test(ch);
    }

    function is_both_separator (ch) {
      return ch == null ||
             ch === ' ' ||
             ch === ',' ||
             ch === '"' ||
             ch === '{' ||
             ch === '}' ||
             ch === '(' ||
             ch === ')' ||
             ch === '[' ||
             ch === ']' ||
             ch === '#' ||
             ch === ':' ||
             ch === '\n' ||
             ch === '\r' ||
             ch === '\t';
    }

    function is_keyword_separator (ch) {
      return ch == null ||
             ch === ' ' ||
             ch === ',' ||
             ch === '"' ||
             ch === '{' ||
             ch === '}' ||
             ch === '(' ||
             ch === ')' ||
             ch === '[' ||
             ch === ']' ||
             ch === '#' ||
             ch === ':' ||
             ch === '\'' ||
             ch === '^' ||
             ch === '@' ||
             ch === '`' ||
             ch === '~' ||
             ch === '\\' ||
             ch === ';' ||
             ch === '\n' ||
             ch === '\r' ||
             ch === '\t';
    }

    var c = function (string, options) {
      this.options  = options || {};
      this.string   = string
      this.position = 0;
      this.line = 1;
    }

    c.isSymbol = is_symbol;

    c.prototype.current = function () {
      return this.string[this.position];
    }

    c.prototype.seek = function (n) {
      return this.position += n;
    }

    c.prototype.after = function (n) {
      return this.string[this.position + n];
    }
    
    c.prototype.substr = function (start, length) {
      return this.string.substr(this.position + start, length);
    }

    c.prototype.start_with = function start_with (match) {
      for (var i = 0; i < match.length; i++) {
        if (this.string[this.position + i] !== match[i]) {
          return false;
        }
      }

      return true;
    }

    c.prototype.eof = function () {
      return this.position >= this.string.length;
    }

    c.prototype.remaining_length = function () {
      return this.string.length - this.position;
    }

    c.prototype.ignore = function () {
      var current = this.current();

      while (!this.eof() && is_ignored(current)) {
        this.seek(1);

        current = this.string[this.position];

        if ( current === '\n' ) this.line++;
      }
    }

    c.prototype.next_type = function () {
      var current = this.current();

      if (!isNaN(parseInt(current))) {
        return "number";
      }

      switch (current) {
        case '^':           return "metadata";
        case 't': case 'f': return "boolean";
        case 'n':           return "nil";
        case '\\':          return "char";
        case ':':           return "keyword";
        case '"':           return "string";
        case '{':           return "map";
        case '(':           return "list";
        case '[':           return "vector";
      }

      if (current == '#') {
        switch (this.after(1)) {
          case 'i': return "instant";
          case '{': return "set";
          case '"': return "regexp";
        }
      }

      return "symbol";
    }

    c.prototype.read_next = function() {
      this.ignore();

      if (this.eof()) {
        //if ( typeof this.current() === 'undefined' ) return null;
        throw new SyntaxError(ws.str('unexpected EOF, at: "', typeof(this.current()), '" ', this.position, ' of: "', this.string, '"'));
      }

      var type   = this.next_type(),
          result = this["read_" + type]();

      //console.log('type:', type);
      //console.log('result:', result);
      if ((type === "nil" || type === "boolean") && result instanceof String) {
        type = "symbol";
      }

      if (type !== "map" && result != null) {
        result.type = type;
      }

      return result;
    }

    c.prototype.read_metadata = function () {
      var metadatas = [];

      while (this.current() === '^') {
        this.seek(1);

        metadatas.push(this.read_next());
      }

      return this.read_next();
    }

    c.prototype.read_nil = function () {
      if (this.remaining_length() < 3 || !this.start_with("nil") || !is_both_separator(this.after(3))) {
        return this.read_symbol();
      }

      this.seek(3);

      return ws.syntax(null, 'nil', this.line);
    }

    c.prototype.read_boolean = function () {
      if (this.current() === 't') {
        if (this.remaining_length() < 4 || !this.start_with("true") || !is_both_separator(this.after(4))) {
          return this.read_symbol();
        }

        this.seek(4);

        return ws.syntax(true, 'boolean', this.line);
      }
      else {
        if (this.remaining_length() < 5 || !this.start_with("false") || !is_both_separator(this.after(5))) {
          return this.read_symbol();
        }

        this.seek(5);

        return ws.syntax(false, 'boolean', this.line);
      }
    }

    c.prototype.read_number = function () {
      var length = 0;

      while (!is_both_separator(this.after(length))) {
        length++;
      }

      var string = this.substr(0, length);

      this.seek(length);

      if (string.indexOf('/') != -1) {
        return ws.syntax(rational(string), 'rational', this.line);
      }
      else if (string.indexOf('r') != -1 || string.indexOf('R') != -1) {
        var parts = string.toLowerCase().split('r')
        var base  = parts.shift();

        return ws.syntax(parseInt(parts.join('r'), base), 'integer', this.line);
      }
      else {
        if (string[string.length - 1] == 'N' || string[string.length - 1] == 'M') {
          string = string.substr(0, string.length - 1);
        }

        return ws.syntax(parseFloat(string), 'float', this.line);
      }
    }

    c.prototype.read_char = function () {
      return null;
    }

    c.prototype.read_symbol = function () {
      var length = 0;

      while (is_symbol(this.after(length))) {
        length++;
      }

      var string = this.substr(0, length);

      this.seek(length);

      return ws.syntax(symbol(string), 'symbol', this.line);
    }

    c.prototype.read_keyword = function () {
      var length = 0;

      this.seek(1);

      while (!is_keyword_separator(this.after(length))) {
        length++;
      }

      var string = this.substr(0, length);

      this.seek(length);

      return ws.syntax(keyword(string), 'keyword', this.line);
    }

    c.prototype.read_string = function () {
      var length = 0;

      this.seek(1);

      while (this.after(length) !== '"') {
        if (this.after(length) === '\\') {
          length++;
        }

        length++;
      }

      var string = this.substr(0, length);

      this.seek(length + 1);

      return ws.syntax(JSON.stringify(unescape(string)), 'string', this.line);
    }

    c.prototype.read_regexp = function () {
      var length = 0;

      this.seek(2);

      while (this.after(length) !== '"') {
        if (this.after(length) === '\\') {
          length++;
        }

        length++;
      }

      var string = this.substr(0, length);

      this.seek(length + 1);

      return ws.syntax(new RegExp(string), 'regex', this.line);
    }

    c.prototype.read_instant = function () {
      this.seek(1);

      if (!this.after(4)) {
        throw new SyntaxError("unexpected EOF");
      }

      if (!this.start_with('inst')) {
        throw new SyntaxError('expected inst, got ' + this.substr(0, 4));
      }

      this.seek(4); this.ignore();

      return ws.syntax(rfc3339(this.read_string()), 'instant', this.line);
    }

    c.prototype.read_list = function () {
      var result = [];

      this.seek(1); this.ignore();

      while (this.current() != ')') {
        result.push(this.read_next());

        this.ignore();
      }

      this.seek(1)

      return ws.syntax(list(result), 'list', this.line);
    }

    c.prototype.read_set = function () {
      var result = [];

      this.seek(2); this.ignore();

      while (this.current() != '}') {
        result.push(this.read_next());

        this.ignore();
      }

      this.seek(1)

      return ws.syntax(set(result), 'set', this.line);
    }

    c.prototype.read_vector = function () {
      var result = [];

      this.seek(1); this.ignore();

      while (this.current() != ']') {
        result.push(this.read_next());

        this.ignore();
      }

      this.seek(1)

      return ws.syntax(vector(result), 'vector', this.line);
    }

    c.prototype.read_map = function () {
      var result = [];

      this.seek(1); this.ignore(); // ignore '{'

      while (this.current() != '}') {
        var key = this.read_next();
        this.ignore();
        var value = this.read_next();
        this.ignore();

        result.push(key);
        result.push(value);
      }

      this.seek(1);

      return ws.syntax(map(result), 'map', this.line);
    }

    c.prototype.parse = function () {
      var result = this.read_next();

      this.ignore();

      if (this.current()) {
        throw new SyntaxError(ws.str("there is some unconsumed input at: ", this.position, ' for: "', this.string, '"'));
      }

      return result;
    }

    return c;
  })();

  wonderscript.edn = {
    keyword:  keyword,
    symbol:   symbol,
    vector:   vector,
    list:     list,
    set:      set,
    rational: rational,

    isKeyword:  is_keyword,
    isSymbol:   is_symbol,
    isList:     is_list,
    isSet:      is_set,
    isVector:   is_vector,
    isRational: is_rational,

    Printer: Printer,
    Reader: Reader,

    stringify: Printer.stringify,

    read: function (obj, options) {
      return new Reader(obj, options).parse();
    }
  };
});

