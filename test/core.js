require("../vendor/closure-library/closure/goog/bootstrap/nodejs.js");
require("../vendor/closure-library/closure/goog/wonderscript_deps.js");

goog.require('wonderscript');
goog.require('wonderscript.types');

var w = wonderscript
  , t = wonderscript.types;

exports.testSymbols = function(test) {
  // quoting
  test.equal('test', w.eval('`test'));
  test.equal('test', w.eval(':test'));
  test.equal('test', w.eval("'test"));

  // booleans
  test.equal(true, w.eval('on'));
  test.equal(true, w.eval('yes'));
  test.equal(true, w.eval('true'));
  test.equal(true, w.eval(true));
  test.equal(false, w.eval('off'));
  test.equal(false, w.eval('no'));
  test.equal(false, w.eval('false'));
  test.equal(false, w.eval(false));

  // null & undefined
  test.equal(null, w.eval(null));
  test.equal(undefined, w.eval(undefined));
  test.done();
};

exports.testNumbers = function(test) {
  test.equal(1, w.eval(1));
  test.equal(1.3141, w.eval(1.3141));
  test.equal(1.3141, w.eval(1.3141));
  test.ok(new t.Rat(3, 4).eq(w.eval('3/4')));
  test.done();
};

exports.testObjects = function(test) {
  // Dates
  var d = w.eval(new Date(2015, 1, 3));
  test.equal(2015, d.getUTCFullYear());
  test.equal(1, d.getUTCMonth());
  test.equal(3, d.getUTCDate());
  test.done();

  // RegExp
  test.ok(w.eval(/^:/).test(':testing'));
  test.ok(w.eval(/TESTING/i).test('testing'));
};

exports.testIntrospection = function(test) {
  test.equal('number', w.eval(['type', 1]));
  test.equal('object', w.eval(['type', {a: 1, b: 2}]));
  test.equal('object', w.eval(['type', ['quote', [1, 2, 3]]]));
  test.equal(true, w.eval(['instance?', new Date(), 'Date']));
  test.equal(true, w.eval(['null?', null]));
  test.equal(false, w.eval(['null?', undefined]));
  test.equal(false, w.eval(['null?', 12312]));
  test.done();
};

exports.specialForms = function(test) {
  test.equal(1, w.eval(['if', 'on', 1, 2]));
  test.equal(2, w.eval(['if', 'on', 2]));
  test.equal(2, w.eval(['if', 'off', 1, 2]));

  test.equal(3, w.eval(['cond',
                          'no', 1,
                          'off', 2,
                          'else', 3]));

  test.equal(2, w.eval(['cond',
                          'on', 2,
                          'else', 3]));

  test.equal(true, w.eval(['?', null]));
  test.equal(false, w.eval(['?', undefined]));
  test.equal(true, w.eval(['null?', null]));
  test.done();
};
