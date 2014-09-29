

module.exports = AjaxError

function AjaxError(statusCode, status, xhr) {
  this.name = "AjaxError"
  this.message = statusCode + ': ' + status
  this.xhr = xhr
  this.statusCode = statusCode

  if ( Error.captureStackTrace ) 
    Error.captureStackTrace(this, AjaxError)
}

AjaxError.prototype = Object.create(Error.prototype)
AjaxError.prototype.constructor = AjaxError