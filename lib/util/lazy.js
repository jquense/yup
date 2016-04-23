'use strict';

exports.__esModule = true;

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('./_');

var isSchema = _require.isSchema;

var Lazy = function () {
  function Lazy(mapFn) {
    _classCallCheck(this, Lazy);

    this._resolve = function () {
      var schema = mapFn.apply(undefined, arguments);
      if (!isSchema(schema)) throw new TypeError('lazy() functions must return a valid schema');

      return schema;
    };
  }

  Lazy.prototype.resolve = function resolve(_ref) {
    var value = _ref.value;

    var rest = _objectWithoutProperties(_ref, ['value']);

    return this._resolve(value, rest);
  };

  Lazy.prototype.cast = function cast(value, options) {
    return this._resolve(value, options).cast(value, options);
  };

  Lazy.prototype.validate = function validate(value, options) {
    return this._resolve(value, options).validate(value, options);
  };

  return Lazy;
}();

Lazy.prototype.__isYupSchema__ = true;

exports.default = Lazy;
module.exports = exports['default'];