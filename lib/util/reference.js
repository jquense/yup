'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var getter = require('property-expr').getter;

var validateName = function validateName(d) {
  if (typeof d !== 'string') throw new TypeError('ref\'s must be strings, got: ' + d);
};

var Ref = (function () {
  Ref.isRef = function isRef(value) {
    return !!(value && (value.__isYupRef || value instanceof Ref));
  };

  function Ref(key, mapFn) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, Ref);

    validateName(key);
    var prefix = options.contextPrefix || '$';

    this.key = key;
    this.prefix = prefix;
    this.isContext = key.indexOf(prefix) === 0;
    this.path = this.isContext ? this.key.slice(this.prefix.length) : this.key;
    this.map = mapFn || function (value) {
      return value;
    };
  }

  Ref.prototype.getValue = function getValue(parent, context) {
    var isContext = this.isContext;

    if (isContext && !context || !isContext && !context && !parent) throw new Error('missing the context necessary to cast this value');

    var value = getter(this.path)(isContext ? context : parent || context);

    return this.map(value);
  };

  return Ref;
})();

exports['default'] = Ref;

Ref.prototype.__isYupRef = true;
module.exports = exports['default'];