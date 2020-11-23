import printValue from './util/printValue';

let strReg = /\$\{\s*(\w+)\s*\}/g;

export default function ValidationError(errors, value, field, type) {
  this.name = 'ValidationError';
  this.value = value;
  this.path = field;
  this.type = type;
  this.errors = [];
  this.inner = [];

  if (errors)
    [].concat(errors).forEach((err) => {
      this.errors = this.errors.concat(err.errors || err);

      if (err.inner)
        this.inner = this.inner.concat(err.inner.length ? err.inner : err);
    });

  this.message =
    this.errors.length > 1
      ? `${this.errors.length} errors occurred`
      : this.errors[0];

  if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

ValidationError.isError = function (err) {
  return err && err.name === 'ValidationError';
};

ValidationError.formatError = function (message, params) {
  const path = params.label || params.path || 'this';
  if (path !== params.path) params = { ...params, path };

  if (typeof message === 'string')
    return message.replace(strReg, (_, key) => printValue(params[key]));
  if (typeof message === 'function') return message(params);

  return message;
};
