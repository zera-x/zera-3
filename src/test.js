goog.require('wonderscript');
goog.provide('wonderscript.test');

goog.scope(function() {

  var ws = wonderscript;
  var test = wonderscript.test;

  // assertions
  
  test.equal = function(actual, expected) {
    ws.eq(actual, expected);
  };

  test.ok = function(pred) {
  };
});
