goog.provide('wonderscript.string');
goog.require('wonderscript');

goog.scope(function(){
  
  var ws = wonderscript;
  var s = ws.string;

  s.dasherize = function(string) {
    return string.replace(new RegExp("([a-z])([A-Z0-9])", "g"), "$1-$2").toLowerCase();
  }

});
