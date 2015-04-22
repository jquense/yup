"use strict";
var babelHelpers = require("./babelHelpers.js");
var strReg = /\$\{\s*(\w+)\s*\}/g;

var replace = function (str) {
  return function (params) {
    return str.replace(strReg, function (_, key) {
      return params[key] || "";
    });
  };
};

module.exports = ValidationError;

function ValidationError(errors, value) {
  var _this = this;

  var field = arguments[2] === undefined ? "" : arguments[2];

  this.name = "ValidationError";
  this.value = value;
  this.path = field;
  this.errors = [];
  this.inner = [];

  [].concat(errors).forEach(function (err) {
    _this.errors = _this.errors.concat(err.errors || err);

    if (err.inner) _this.inner = _this.inner.concat(err.inner.length ? err.inner : err);
  });

  this.message = this.errors.length > 1 ? "" + this.errors.length + " errors occurred" : this.errors[0];

  if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

ValidationError.formatError = function (message, params) {
  if (typeof message === "string") message = replace(message);

  var fn = function (_ref) {
    var path = _ref.path;
    var params = babelHelpers.objectWithoutProperties(_ref, ["path"]);

    params.path = "this" + (path ? path.charAt(0) === "[" ? path : "." + path : "");

    return message(params);
  };

  return arguments.length === 1 ? fn : fn(params);
};