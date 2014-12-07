'use strict';
module.exports = ValidationError;

function ValidationError(errors) {
  this.name    = "ValidationError";
  this.errors  = errors == null ? [] : [].concat(errors)
  this.message = this.errors[0]

  if (Error.captureStackTrace)
    Error.captureStackTrace(this, ValidationError);
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;