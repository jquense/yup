'use strict';
var slice = Array.prototype.slice;

// Phantom js polyfill
if (!Function.prototype.bind) {
  Function.prototype.bind = function(context) {
    var func = this;
    var args = slice.call(arguments, 1);

    function bound() {
      var invokedAsConstructor = func.prototype && (this instanceof func);
      return func.apply(
        !invokedAsConstructor && context || this,
        args.concat(slice.call(arguments))
      );
    }
    bound.prototype = func.prototype;
    return bound;
  };
}


var chai = require('chai')

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

chai.should();

var testsContext = require.context("./test", true);

testsContext.keys().forEach(testsContext);
