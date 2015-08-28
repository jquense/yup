'use strict';

var babelHelpers = require('./babelHelpers.js');

var strReg = /\$\{\s*(\w+)\s*\}/g;

var replace = function replace(str) {
  return function (params) {
    return str.replace(strReg, function (_, key) {
      return params[key] || '';
    });
  };
};

module.exports = ValidationError;

function ValidationError(errors, value, field) {
  var _this = this;

  this.name = 'ValidationError';
  this.value = value;
  this.path = field;
  this.errors = [];
  this.inner = [];

  if (errors) [].concat(errors).forEach(function (err) {
    _this.errors = _this.errors.concat(err.errors || err);

    if (err.inner) _this.inner = _this.inner.concat(err.inner.length ? err.inner : err);
  });

  this.message = this.errors.length > 1 ? '' + this.errors.length + ' errors occurred' : this.errors[0];

  if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

ValidationError.isError = function (err) {
  return err && err.name === 'ValidationError';
};

ValidationError.formatError = function (message, params) {
  if (typeof message === 'string') message = replace(message);

  var fn = function fn(_ref2) {
    var path = _ref2.path;
    var params = babelHelpers.objectWithoutProperties(_ref2, ['path']);

    params.path = path || 'this';

    return message(params);
  };

  return arguments.length === 1 ? fn : fn(params);
};

ValidationError.prototype.toJSON = function () {
  var _ref;

  if (this.inner.length) return this.inner.reduce(function (list, e) {
    list[e.path] = (list[e.path] || (list[e.path] = [])).concat(e.errors);
    return list;
  }, {});

  if (this.path) return (_ref = {}, _ref[this.path] = err.errors, _ref);

  return err.errors;
};