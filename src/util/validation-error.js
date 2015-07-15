'use strict';
var strReg = /\$\{\s*(\w+)\s*\}/g;

let replace = str =>
  params => str.replace(strReg, (_, key) => params[key] || '')

module.exports = ValidationError;

function ValidationError(errors, field, value) {
  this.name     = 'ValidationError'
  this.value    = value
  this.path     = field
  this.errors   = []
  this.inner    = [];

  if ( errors )
    [].concat(errors).forEach(err => {
      this.errors = this.errors.concat(err.errors || err)

      if ( err.inner )
        this.inner = this.inner.concat(err.inner.length ? err.inner : err)
    })

  this.message = this.errors.length > 1
    ? `${this.errors.length } errors occurred`
    : this.errors[0]

  if (Error.captureStackTrace)
    Error.captureStackTrace(this, ValidationError);
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

ValidationError.isError = function(err){
  return err && err.name === 'ValidationError'
}

ValidationError.formatError = function(message, params) {
  if ( typeof message === 'string')
    message = replace(message)

  let fn = ({ path, ...params }) => {
    params.path = path || 'this'

    return message(params)
  }

  return arguments.length === 1 ? fn : fn(params)
}
