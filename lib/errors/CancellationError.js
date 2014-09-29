
module.exports = CancellationError

function CancellationError(message, errors){
  this.message = message
  this.name = "CancellationError"
  this.errors = errors

  if ( Error.captureStackTrace ) 
    Error.captureStackTrace(this, CancellationError)
}

CancellationError.prototype = Object.create(Error.prototype)
CancellationError.prototype.constructor = CancellationError