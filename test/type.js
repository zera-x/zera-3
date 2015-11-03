require("../vendor/closure-library/closure/goog/bootstrap/nodejs.js");
require("../vendor/closure-library/closure/goog/wonderscript_deps.js");

goog.require('wonderscript');
goog.require('wonderscript.types');

var w = wonderscript
  , t = wonderscript.types;

function read(val) {
  return w.eval(w.read(val));
}

exports.testRational = function(test) {
  var a = new w.Rat(3, 4)
    , b = new w.Rat(4, 5);
  test.equal(3, a.m, "the numerator of a is 3");
  test.equal(4, b.m, "the denominator of a is 4");
  test.ok(a.add(1).eq(new w.Rat(7, 4)),  "3/4 + 1 = 7/4");
  test.ok(a.sub(1).eq(new w.Rat(-1, 4)),  "3/4 - 1 = -1/4");
  test.ok(a.mult(2).eq(new w.Rat(6, 4)),  "3/4 * 2 = 6/4");
  test.ok(a.div(2).eq(new w.Rat(3, 8)),  "3/4 / 2 = 3/8");
  test.ok(w.eval(w.read('5/6')).eq(new w.Rat(5, 6)), "5/6 is read as new Rat(5, 6)");
  test.done();
};

exports.testObjectMap = function(test) {
  test.ok(w.eq(w.objectMap('a', 1, 'b', 2), read('(objectMap :a 1 :b 2)')));
  var m = read('(objectMap :toString (fn [] "A string"))');
  test.equal("A string", m.get('toString')());

  test.ok(w.eq([['a', 1], ['b', 2]], read('(.entries {:a 1 :b 2})')));

  test.done();
};
