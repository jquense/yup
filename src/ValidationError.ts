import printValue from './util/printValue';
import toArray from './util/toArray';

let strReg = /\$\{\s*(\w+)\s*\}/g;

type Params = Record<string, unknown>;

export default class ValidationError extends Error {
  value: any;
  path?: string;
  type?: string;
  errors: string[];

  params?: Params;

  inner: ValidationError[];

  static formatError(
    message: string | ((params: Params) => string) | unknown,
    params: Params,
  ) {
    const path = params.label || params.path || 'this';
    if (path !== params.path) params = { ...params, path };

    if (typeof message === 'string')
      return message.replace(strReg, (_, key) => printValue(params[key]));

    if (typeof message === 'function') {
      const result = message(params)

      if (typeof result === 'function') {
        return result(params)
      } else {
        return result
      }
    }

    return message;
  }
  static isError(err: any): err is ValidationError {
    return err && err.name === 'ValidationError';
  }

  constructor(
    errorOrErrors: string | ValidationError | ValidationError[],
    value?: any,
    field?: string,
    type?: string,
  ) {
    super();

    this.name = 'ValidationError';
    this.value = value;
    this.path = field;
    this.type = type;

    this.errors = [];
    this.inner = [];

    toArray(errorOrErrors).forEach((err) => {
      if (ValidationError.isError(err)) {
        this.errors.push(...err.errors);
        this.inner = this.inner.concat(err.inner.length ? err.inner : err);
      } else {
        this.errors.push(err);
      }
    });

    this.message =
      this.errors.length > 1
        ? `${this.errors.length} errors occurred`
        : this.errors[0];

    if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
  }
}
