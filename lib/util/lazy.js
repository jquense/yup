'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('./_');

var isSchema = _require.isSchema;

var Lazy = function () {
  function Lazy(mapFn) {
    _classCallCheck(this, Lazy);

    this._resolve = function (value) {
      var schema = mapFn(value);
      if (!isSchema(schema)) throw new TypeError('lazy() functions must return a valid schema');

      return schema;
    };
  }

  Lazy.prototype.resolve = function resolve(context, parent, value) {
    return this._resolve(value);
  };

  Lazy.prototype.cast = function cast(value, options) {
    return this._resolve(value).cast(value, options);
  };

  Lazy.prototype.validate = function validate(value, options) {
    return this._resolve(value).validate(value, options);
  };

  return Lazy;
}();

exports.default = Lazy;
module.exports = exports['default'];