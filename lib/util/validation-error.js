'use strict';

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var strReg = /\$\{\s*(\w+)\s*\}/g;

var replace = function replace(str) {
  return function (params) {
    return str.replace(strReg, function (_, key) {
      return params[key] || '';
    });
  };
};

module.exports = ValidationError;

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
    var path = _ref.path;
    var label = _ref.label;

    var params = _objectWithoutProperties(_ref, ['path', 'label']);

    params.path = label || path || 'this';

    return message(params);
  };

  return arguments.length === 1 ? fn : fn(params);
};

ValidationError.prototype.toJSON = function () {
  var _ref2;

  if (this.inner.length) return this.inner.reduce(function (list, e) {
    list[e.path] = (list[e.path] || (list[e.path] = [])).concat(e.toJSON());
    return list;
  }, {});

  if (this.path) return _ref2 = {}, _ref2[this.path] = { errors: this.errors, path: this.path, type: this.type }, _ref2;

  return err.errors;
};