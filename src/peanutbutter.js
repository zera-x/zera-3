goog.require('wonderscript');
goog.provide('peanutbutter');

if ( typeof module !== 'undefined' && module.exports ) {
  module.exports = wonderscript;
}

if ( typeof module !== 'undefined' && _ == null ) {
  var _  = require('underscore-contrib');
  _.mapObject = function(object){};
  _.merge = function(a, b){};
}

goog.scope(function(){
  "use strict";

  var pb = peanutbutter;
  var ws = wonderscript;

  // Utils
  // -----

  var str = ws.str;
  var dissoc = ws.dissoc;
  
  // walk trees
  var walk = function(inner, outer, form) {
    if      (   isNil  (form) ) return outer([]);
    else if ( _.isArray(form) ) return outer(_.map(form, inner));
    else                        return outer(inner(form));
  };

  var isNil = function(exp) {
    return (_.isArray(exp) && _.size(exp) === 0) || !exists(exp);
  };

  function exists (obj) {
    return obj != null;
  }

  var verify = function(prop, proto, success, failure) {
    if ( exists(proto) && exists(proto[prop]) ) {
      if ( success ) return success(proto[prop], prop, proto);
      else           return proto[prop];
    }
    else {
      if ( failure ) return failure(prop, proto);
      else           throw(str("'", prop, "' is required"));
    }
  };

  var defaultTo = function(prop, proto, def) {
    return verify(prop, proto, null, function(){ return def });
  };
  
  // pretty print forms
  var pp = _.memoize(function(forms) {
    var outer = function(form) {
      if ( _.isArray(form) ) return str('[', form.join(', '), ']');
      else                   return form;
    };

    var inner = function(form) {
      if      ( _.isArray(form) ) return pp(form);
      else if ( _.isObject(form) && !_.isFunction(form) ) {
        var objStr = _.reduce(form, function(memo, value, key) {
          var pair = str("'", key, "':", pp(value));
          if ( memo ) return str(memo, ', ', pair);
          else        return pair;
        }, null);
        return str('{', objStr, '}');
      }
      else if ( typeof(form) === 'string' ) {
        return str("'", form, "'");
      }
      else {
        return str(form);
      }
    };

    return walk(inner, outer, forms);
  });

  pb.utils = {
      str       : str
    , pp        : pp
    , defaultTo : defaultTo
    , verify    : verify
    , exists    : exists
    , isNil     : isNil
  };

  // JAML (HTML Generation)
  // ----------------------

  pb.html = (function(){
    var isAtom = function(obj) {
      return !_.isObject(obj) && typeof(obj) !== 'undefined';
    };
  
    var isTag = function(exp) {
      return _.isArray(exp) && typeof(_.first(exp)) === 'string';
    };
  
    var children = function(tag) {
      if ( isNil(tag) || !isTag(tag) ) return [];
      else {
        if ( hasAttrs(tag) ) return _.filter(_.rest(_.rest(tag)), isTag);
        else                 return _.filter(_.rest(tag), isTag);
      }
    };
  
    var text = function(tag) {
      if ( isNil(tag) || !isTag(tag) ) return [];
      else {
        if ( hasAttrs(tag) ) return _.reject(_.rest(_.rest(tag)), isTag);
        else                 return _.reject(_.rest(tag), isTag);
      }
    };
  
    var content = function(tag) {
      if ( isNil(tag) || !isTag(tag) ) return [];
      else {
        if ( hasAttrs(tag) ) return _.rest(_.rest(tag));
        else                 return _.rest(tag);
      }
    };
  
    var name = function(tag) {
      return _.first(tag);
    };
  
    var hasAttrs = function(exp) {
      return isTag(exp) && isAttrs(_.first(_.rest(exp)));
    };
  
    var attrs = function(form) {
      return _.first(_.rest(form))
    };
  
    var isAttrs = function(exp) {
      return _.isObject(exp) && !_.isFunction(exp) && !_.isArray(exp);
    };
  
    // render object as an HTML attribute list
    var renderAttrs = function(obj, env) {
      var buffer = '', attr;
      for ( attr in obj ) {
        buffer += ' ' + renderAttrValue(attr, obj[attr], env);
      }
      return buffer;
    };

    var EVENTS = {
        'click': 'onclick'
      , 'dblclick': 'ondblclick'
      , 'focus': 'onfocus'
      , 'mousedown': 'onmousedown'
      , 'mouseup': 'onmouseup'
      , 'mouseover': 'onmouseover'
      , 'mousemove': 'onmousemove'
      , 'mouseout': 'onmouseout'
      , 'dragstart': 'ondragstart'
      , 'drag': 'ondrag'
      , 'dragenter': 'ondragenter'
      , 'dragleave': 'ondragleave'
      , 'dragover': 'ondragover'
      , 'drop': 'ondrop'
      , 'change': 'onchange'
      , 'dragend': 'ondragend'
      , 'load': 'onload'
      , 'onclick': 'onclick'
      , 'ondblclick': 'ondblclick'
      , 'onfocus': 'onfocus'
      , 'onmousedown': 'onmousedown'
      , 'onmouseup': 'onmouseup'
      , 'onmouseover': 'onmouseover'
      , 'onmousemove': 'onmousemove'
      , 'onmouseout': 'onmouseout'
      , 'ondragstart': 'ondragstart'
      , 'ondrag': 'ondrag'
      , 'ondragenter': 'ondragenter'
      , 'ondragleave': 'ondragleave'
      , 'ondragover': 'ondragover'
      , 'ondrop': 'ondrop'
      , 'ondragend': 'ondragend'
      , 'onload': 'onload'
      , 'onchange': 'onchange'
    }

    var isCB = function(name) {
      return !!EVENTS[name];
    };
  
    var fnSource = function(f) {
      var s = "(" + f.toString() + ")()";
      return encodeHTML(s);
    };

    var escapeHTML = function(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    };

    function renderAttrValue (key, value, env) {
        var env = env || {};
        if ( (key === 'class' || key === 'id') && _.isArray(value) ) {
          return str(key, '="', value.join(' '), '"');
        }
        else if ( isCB(key) && _.isArray(value) ) return str(EVENTS[key], "='", ws.emit(value, env), "'");
        else if ( _.isBoolean(value) ) {
          if ( value === true ) return str(key);
          else                  return "";
        }
        else if ( key === 'style' && isCSSRule(value) ) return str(key, '="', renderCSSRule(value), '"');
        else                                            return str(key, '="', value, '"');
    };
  
    var DEFINITIONS = {};

    var define = function(name, fn) {
      DEFINITIONS[name] = fn;
      return name;
    };

    var genID = function() {
      var last = 1;
      return function() {
        var n = last++;
        n = ((n >> 16) ^ n) * 0x45d9f3b;
        n = ((n >> 16) ^ n) * 0x45d9f3b;
        n = ((n >> 16) ^ n);
        return n;
      };
    }();

    var INDEXES = {
        nave: {}
      , ave: {}
      , ne: {}
    };

    var index = function(id, name, attrs) {
      var ne = INDEXES['ne'];
      ne[name] = ne[name] || [];
      ne[name].push(id);
      var nave = INDEXES['nave'];
      _.each(attrs, function(v, k){
        nave[name] = nave[name] || {};
        nave[name][k] = nave[name][k] || {};
        if ( (k === 'class' || k === 'id') && v && v instanceof Array ) {
          _.each(v, function(v){
            nave[name][k][v] = nave[name][k][v] || [];
            nave[name][k][v].push(id);
          });
        }
        else {
          nave[name][k][v] = nave[name][k][v] || [];
          nave[name][k][v].push(id);
        }
      });
      var ave = INDEXES['ave'];
      _.each(attrs, function(v, k){
        ave[k] = ave[k] || {};
        if ( (k === 'class' || k === 'id') && v && v instanceof Array ) {
          _.each(v, function(v){
            ave[k][v] = ave[k][v] || [];
            ave[k][v].push(id);
          });
        }
        else {
          ave[k][v] = ave[k][v] || [];
          ave[k][v].push(id);
        }
      });
    };

    var get = function(id) {
      return document.getElementById(id);
    };

    var find = function() {
      var tag, preds;
      if ( arguments.length === 2 ) {
        tag = arguments[0];
        preds = arguments[1];
      }
      else if ( arguments.length === 1 ) {
        if ( typeof arguments[0] === 'string' ) {
          tag = arguments[0];
        }
        else {
          preds = arguments[0];
        }
      }
      else {
        throw new Error("at least one argument is required");
      }

      var idx, eids = [];
      if ( tag && preds ) {
        idx = INDEXES['nave'][tag];
        if ( idx ) {
          var eids = _.flatten(_.filter(_.map(preds, function(val, attr){
            return idx[attr] && idx[attr][val];
          }), exists), true);
        }
      }
      else if ( tag ) {
        eids = INDEXES['ne'][tag] || [];
      }
      else if ( preds ) {
        idx = INDEXES['ave'];
        eids = _.flatten(_.filter(_.map(preds, function(val, attr){
          return idx[attr] && idx[attr][val];
        }), exists), true);
      }
      return _.map(eids, get);
    };

    // render s-expression tag as HTML
    var renderTag = function(form, opts) {
      var tag         = macroExpand(form)
        , tagName     = name(tag)
        , rest        = content(tag)
        , attr        = hasAttrs(tag) ? attrs(tag) : {}
        , prettyPrint = defaultTo('prettyPrint', opts, true)
        , env         = defaultTo('env', opts, {})
        , def         = env[tagName]
        , args, code, id = genID(), lazy = false;

      attr['data-element-id'] = id;
      attr['id'] = attr['id'] || id;

      if ( attr['lazy'] ) {
        lazy = true;
        attr = dissoc(attr, 'lazy');
      }

      env = _.merge(env, attr); // add attr values to scope
      env = _.merge(env, _.mapObject(attr, function(v){ return env[v] || v })); // lookup values in scope

      if ( def && typeof(def) === 'function' ) {
        args = _.cons(attr, rest);
        code = html(def.apply(attr, args), {env: env});
      }
      else {
        if ( isNil(content) ) code = str('<', tagName, renderAttrs(attr, env), '>');
        else                  code = str('<', tagName, renderAttrs(attr, env), '>', html(rest, {env: env}), '</', tagName, '>');
      }

      // TODO: add render-delay, onrender
      if ( lazy ) {
        code = html([['script', {type: 'text/javascript'},
                      str("(function(){",
                            "var $elem = jQuery('.lazy-container[data-ref-id=", id, "]');",
                            "$elem.parent().ready(function(){",
                              "$elem.html('", code, "');",
                              "$elem.removeClass('hide');",
                            "});",
                          "}())")],
                      ['.lazy-container.hide', {'data-ref-id': id}]]);
      }

      return code;
    };

    function Tag(name, attrs, children, env) {
      var children = children || []
        , attrs = attrs || {}
        , i = 0
        , k
        , kids;

      kids = new TagList(children, env);
      this.length = kids.length;
      this.pb$lang$children = kids;
      for (; i < this.length; ++i) {
        this[i] = kids[i];
      }

      //if ( env != null ) throw new Error("an environment is required");

      this.pb$lang$name = name;
      this.pb$lang$attrs = attrs;
      this.pb$lang$env = env;
    }

    Tag.prototype.name = function(){ return this.pb$lang$name };
    Tag.prototype.attrs = function(){ return this.pb$lang$attrs };
    Tag.prototype.children = function(){ return this.pb$lang$children };
    Tag.prototype.env = function(){ return this.pb$lang$env };

    Tag.prototype.id = function() {
      return this['data-element-id'];
    };

    Tag.prototype.attr = function(k) {
      return this.attrs()[k];
    };

    Tag.prototype.has = function(k) {
      return typeof this.pb$lang$attrs[k] !== 'undefined';
    };

    Tag.prototype.hasDefinition = function(){
      return !!this.env()[this.name()];
    };

    Tag.prototype.definition = function() {
      if ( this.env() != null ) {
        return this.env()[this.name()];
      }
      return null;
    };

    Tag.prototype.toHTML = function(opts) {
      var def = this.definition()
        , code
        , args
        , lazy = false
        , id = genID()
        , attrs = this.attrs()
        , onrender;

      if ( attrs['lazy'] ) {
        lazy = true;
        attrs = dissoc(attrs, 'lazy');
      }

      if ( attrs['onrender'] ) {
        onrender = evalFn(attrs['onrender'], this.env());
        attrs = dissoc(attrs, 'onrender');
      }

      if ( isNil(this.children()) ) code = str('<', this.name(), renderAttrs(attrs, this.env()), '>');
      else {
        var kids = _.map(this.children(), function(child){ return child.toHTML(opts) }).join('');
        code = str('<', this.name(), renderAttrs(attrs, this.env()), '>', kids, '</', this.name(), '>');
      }

      // TODO: add render-delay, onrender
      if ( lazy ) {
        code = html([['script', {type: 'text/javascript'},
                      str("(function(){",
                            "var $elem = jQuery('.lazy-container[data-ref-id=", id, "]');",
                            "$elem.parent().ready(function(){",
                              '(function(){',
                                onrender, ';',
                              '}($elem[0]));',
                              "$elem.html('", code, "');",
                              "$elem.removeClass('hide');",
                            "});",
                          "}())")],
                      ['.lazy-container.hide', {'data-ref-id': id}]]);
      }

      return code;
    };

    function tag(form, env) {
      var tag     = macroExpand(form)
        , tagName = name(tag)
        , rest    = content(tag)
        , attr    = hasAttrs(tag) ? attrs(tag) : {}
        , id      = genID();

      attr['data-element-id'] = id;
      attr['id'] = attr['id'] || id;

      env = _.merge(env, attr); // add attr values to scope
      env = _.merge(env, _.mapObject(attr, function(v){ return env[v] || v })); // lookup values in scope

      return new Tag(tagName, attr, rest, env);
    }

    function Atom(value, env) {
      this.pb$lang$value = value;
      this.pb$lang$env = env;
    }
    Atom.prototype.valueOf = function() { return this.pb$lang$value };
    Atom.prototype.env = function(k) {
      if ( typeof k !== 'undefined' ) return this.pb$lang$env[k];
      return this.pb$lang$env
    };
    Atom.prototype.toString = function() {
      return this.valueOf().toString();
    };
    Atom.prototype.toHTML = function() {
      var v = this.env(this.valueOf());
      if ( typeof v !== 'undefined' ) return v.toString();
      return this.toString();
    };

    function Nil(value) {
      this.pb$lang$value = value;
    }
    Nil.prototype.valueOf = function() { return this.pb$lang$value };
    Nil.prototype.toHTML = function() { return "" };

    function scope(value, env) {
      var env = env || {}
        , bindings = _.mapObject(value[1], function(v){ return env[v] || v });
      return new TagList(value.slice(2), _.merge(env, bindings));
    }

    function TagList(value, env) {
      this.pb$lang$value = value;
      this.pb$lang$env = env;

      var kids = _.map(value, function(f){ return evaluate(f, {env: env}) });
      this.pb$lang$children = kids;
      this.length = value ? value.length : 0;
      var i = 0;
      for (; i < this.length; ++i) {
        this[i] = kids[i];
      }
    };
    TagList.prototype.valueOf = function() { return this.pb$lang$value };
    TagList.prototype.env = function() { return this.pb$lang$env };
    TagList.prototype.children = function() { return this.pb$lang$children };
    TagList.prototype.toHTML = function(opts) { return _.map(this.children(), function(ch){ return ch.toHTML(opts) }).join(''); };

    function evaluate (form, opts) {
      var expandMacros = defaultTo('expandMacros', opts, true)
        , prettyPrint  = defaultTo('prettyPrint', opts, true)
        , env          = defaultTo('env', opts, DEFINITIONS);

      if      (   isNil  (form) ) return new Nil(form);
      else if (   isAtom (form) ) return new Atom(form, env);
      else if ( form[0] === 'let' ) return scope(form, env);
      else if (   isTag  (form) ) {
        var def = env[form[0]];
        if ( def && typeof(def) === 'function' ) {
          if ( hasAttrs(form) ) {
            var attr = attrs(form)
              , args = _.cons(attr, form.slice(2));
          }
          else {
            var attr = {}
              , args = _.cons(attr, form.slice(1));
          }
          return new TagList(def.apply(attr, args), env);
        }
        return tag(form, env);
      }
      else if ( _.isArray(form) ) return new TagList(form, env);
      else {
        console.error("invalid form:", form);
        throw new Error(str("invalid form"));
      }
    };

    // convert s-expressions into HTML code
    function html (form, opts) {
      return evaluate(form, opts).toHTML();
    }
    ws.html = html;
  
    // walk tag trees
    var walkTags = _.memoize(function(form, fn) {
      var inner = function(form) {
        if ( isTag(form) ) return fn(form);
        else               return form;
      };
      var outer = function(form) { return form };
      return walk(inner, outer, form);
    });
  

    // expand macros
    var macroExpand = function(form) {
      var name = _.first(form);
      if ( /\./.test(name) || /#/.test(name) ) {
        var parts   = name.split(/(\.|\#)/)
          , tag     = parts[0] || 'div'
          , i       = 0
          , classes = []
          , ids     = []
          , ctx     = null;

        if ( hasAttrs(form) ) var newAttrs = attrs(form);
        else                  var newAttrs = {};
  
        if ( newAttrs['class'] ) {
          classes.push(newAttrs['class']);
          classes = _.flatten(classes);
        }

        if ( newAttrs['id'] ) {
          ids.push(newAttrs['id']);
          ids = _.flatten(ids);
        }
  
        for (; i < parts.length; i++) {
          if ( parts[i] === '.' ) {
            ctx = 'class';
            continue;
          }
          else if ( parts[i] === '#' ) {
            ctx = 'id';
            continue;
          }
          else {
            if ( ctx === 'class' ) {
              classes.push(parts[i]);
              continue;
            }
            if ( ctx === 'id' ) {
              ids.push(parts[i]);
              continue;
            }
          }
        }

        if ( classes.length !== 0 ) newAttrs['class'] = classes;
        if ( ids.length !== 0 ) newAttrs['id'] = ids;
        var newForm  = _.flatten([tag, newAttrs, children(form), text(form)], true);
        return newForm;
      }
      else {
        return form;
      }
    };

    var renderTo = function(elem, forms) {
      if ( !exists(jQuery) ) throw("jQuery is required");
      else {
        jQuery(elem).html(html(forms));
      }
    };

    var appendTo = function(elem, forms) {
      if ( !exists(jQuery) ) throw("jQuery is required");
      else {
        jQuery(elem).append(html(forms));
      }
    };

    var replace = function(elem, forms) {
      if ( !exists(jQuery) ) throw new Error("jQuery is required");
      
      var tags = evaluate(forms)
        , elem = elem;

      if ( elem instanceof Tag ) elem = str('[data-element-id=', elem.id(), ']');
      else if ( elem instanceof TagList ) {
        elem = _.invoke(elem.children(), 'attr', 'data-element-id').join(', ');
      }

      jQuery(elem).replaceWith(tags.toHTML());
      return tags;
    };

    function toFn (form) {
      return function () {
        return [].concat(form, _.toArray(arguments));
      }
    }

    // HTML Helper Functions
    // ---------------------

    var mapSelectOptions = function(options) {
      if      ( _.size(options) === 0 ) return [];
      else if ( _.isArray(options)  ) {
        if ( _.has(_.first(options), 'name') && _.has(_.first(options), 'value') ) {
          return _.map(options, function(o) {
            if ( o.selected === true || o.selected === 'selected' ) {
              return ['option', {value: o.value, selected: 'selected'}, o.name]
            }
            else return ['option', {value: o.value}, o.name];
          });
        }
        else return _.map(options, function(o) { return ['option', o] });
      }
      else {
        throw("options list must be an array");
      }
    };

    var select = function(name, options, htmlOpts) {
      var htmlOpts = htmlOpts || {};
      return [['select', _.extend({name: name}, htmlOpts), mapSelectOptions(options)]];
    };

    // Higher-order functions
    pb.map = function(list, tag, attrs) {
      var i = 0
        , a = [];
      for (; i < list.length; i++) {
        if ( attrs ) a.push([tag, attrs, list[i]]);
        else a.push([tag, list[i]]);
      };
      return a;
    };

    return _.extend(html, {
        isAtom:      isAtom
      , isTag:       isTag
      , children:    children
      , text:        text
      , name:        name
      , content:     content
      , isNil:       isNil
      , isAttrs:     isAttrs
      , hasAttrs:    hasAttrs
      , attrs:       attrs
      , walkTags:    walkTags
      , macroExpand: macroExpand
      , select:      select
      , appendTo:    appendTo
      , renderTo:    renderTo
      , replace:     replace
      , define:      define
      , genID:       genID
      , INDEXES:     INDEXES
      , find:        find
      , get:         get
      , eval:        evaluate
      , toFn:        toFn
    });
  }());

  // CSS
  // ---

  var renderCSSRule = function(obj) {
    return _.reduce(obj, function(memo, value, key) {
      if ( memo === null ) return str(key, ':', value, ';');
      else                 return str(memo, ' ', key, ':', value, ';');
    }, null);
  };

  var isCSSRule = function(obj) {
    return exists(obj) && _.isObject(obj);
  };

  // export for Node.js
  if ( typeof exports !== 'undefined' ) {
    exports.html   = pb.html;
    exports.utils  = pb.utils;
  }
});
