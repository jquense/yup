import printValue from './util/printValue';

const strReg = /\$\{\s*(\w+)\s*\}/g;

const replace = str =>
  params => str.replace(strReg, (_, key) => printValue(params[key]));


export default function ValidationError(errors, value, field, type) {
  this.name = 'ValidationError';
  this.value = value;
  this.path = field;
  this.type = type;
  this.errors = [];
  this.inner = [];

  if (errors) {
    [].concat(errors).forEach((err) => {
      this.errors = this.errors.concat(err.errors || err);

      if (err.inner) { this.inner = this.inner.concat(err.inner.length ? err.inner : err); }
    });
  }

  this.message = this.errors.length > 1
    ? `${this.errors.length} errors occurred`
    : this.errors[0];

  if (Error.captureStackTrace) { Error.captureStackTrace(this, ValidationError); }
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

ValidationError.isError = function isError(err) {
  return err && err.name === 'ValidationError';
};

ValidationError.formatError = function formatError(message, params) {
  const messageFunction = (typeof message === 'string') ? replace(message) : message;

  const fn = ({ path, label, ...rest }) => {
    const parameters = { ...rest, path: label || path || 'this' };
    if (typeof messageFunction === 'function') {
      return messageFunction(parameters);
    }
    return messageFunction;
  };

  return arguments.length === 1 ? fn : fn(params);
};
