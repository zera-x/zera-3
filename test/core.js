require("../vendor/closure-library/closure/goog/bootstrap/nodejs.js");
require("../vendor/closure-library/closure/goog/wonderscript_deps.js");

goog.require('wonderscript');
goog.require('wonderscript.types');

var w = wonderscript
  , t = wonderscript.types;

exports.testRational = function(test) {
  var a = new t.Rat(3, 4)
    , b = new t.Rat(4, 5);
  test.equal(3, a.m, "the numerator of a is 3");
  test.equal(4, b.m, "the denominator of a is 4");
  test.ok(a.add(1).eq(new t.Rat(7, 4)),  "3/4 + 1 = 7/4");
  test.ok(a.sub(1).eq(new t.Rat(-1, 4)),  "3/4 - 1 = -1/4");
  test.ok(a.mult(2).eq(new t.Rat(6, 4)),  "3/4 * 2 = 6/4");
  test.ok(a.div(2).eq(new t.Rat(3, 8)),  "3/4 / 2 = 3/8");
  test.done();
};

exports.testSymbol = function(test) {
  var s = new t.Symbol("wonderscript/core");
};
