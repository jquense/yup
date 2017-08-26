'use strict';

exports.__esModule = true;

var _propertyExpr = require('property-expr');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var validateName = function validateName(d) {
  if (typeof d !== 'string') throw new TypeError('ref\'s must be strings, got: ' + d);
};

var Reference = function () {
  Reference.isRef = function isRef(value) {
    return !!(value && (value.__isYupRef || value instanceof Reference));
  };

  function Reference(key, mapFn) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, Reference);

    validateName(key);
    var prefix = options.contextPrefix || '$';

    if (typeof key === 'function') {
      key = '.';
    }

    this.key = key.trim();
    this.prefix = prefix;
    this.isContext = this.key.indexOf(prefix) === 0;
    this.isSelf = this.key === '.';

    this.path = this.isContext ? this.key.slice(this.prefix.length) : this.key;
    this._get = (0, _propertyExpr.getter)(this.path, true);
    this.map = mapFn || function (value) {
      return value;
    };
  }

  Reference.prototype.resolve = function resolve() {
    return this;
  };

  Reference.prototype.cast = function cast(value, _ref) {
    var parent = _ref.parent,
        context = _ref.context;

    return this.getValue(parent, context);
  };

  Reference.prototype.getValue = function getValue(parent, context) {
    var isContext = this.isContext;
    var value = this._get(isContext ? context : parent || context || {});
    return this.map(value);
  };

  return Reference;
}();

exports.default = Reference;


Reference.prototype.__isYupRef = true;
module.exports = exports['default'];