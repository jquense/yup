'use strict';

exports.__esModule = true;
exports.default = ValidationError;

var _printValue = require('./util/printValue');

var _printValue2 = _interopRequireDefault(_printValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var strReg = /\$\{\s*(\w+)\s*\}/g;

var replace = function replace(str) {
  return function (params) {
    return str.replace(strReg, function (_, key) {
      return (0, _printValue2.default)(params[key]);
    });
  };
};

function ValidationError(errors, value, field, type) {
  var _this = this;

  this.name = 'ValidationError';
  this.value = value;
  this.path = field;
  this.type = type;
  this.errors = [];
  this.inner = [];

  if (errors) [].concat(errors).forEach(function (err) {
    _this.errors = _this.errors.concat(err.errors || err);

    if (err.inner) _this.inner = _this.inner.concat(err.inner.length ? err.inner : err);
  });

  this.message = this.errors.length > 1 ? this.errors.length + ' errors occurred' : this.errors[0];

  if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

ValidationError.isError = function (err) {
  return err && err.name === 'ValidationError';
};

ValidationError.formatError = function (message, params) {

  if (typeof message === 'string') message = replace(message);

  var fn = function fn(_ref) {
    var path = _ref.path,
        label = _ref.label,
        params = _objectWithoutProperties(_ref, ['path', 'label']);

    params.path = label || path || 'this';
    return typeof message === 'function' ? message(params) : message;
  };

  return arguments.length === 1 ? fn : fn(params);
};
module.exports = exports['default'];