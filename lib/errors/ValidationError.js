

module.exports = ValidationError

function ValidationError(message, errors){
  this.message = message
  this.name = "ValidationError"
  this.errors = errors

  if ( Error.captureStackTrace ) Error.captureStackTrace(this, ValidationError)
  else                           this.stack = (new Error).stack
}

ValidationError.prototype = Object.create(Error.prototype)
ValidationError.prototype.constructor = ValidationError