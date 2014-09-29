

module.exports = CastError

function CastError(message) {
  this.name = "CastError"
  this.message = message

  if ( Error.captureStackTrace ) 
    Error.captureStackTrace(this, CastError)
}

CastError.prototype = Object.create(Error.prototype)
CastError.prototype.constructor = CastError