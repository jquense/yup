import ValidationError from './ValidationError';
import printValue from './util/printValue';
import toArray from './util/toArray';

let strReg = /\$\{\s*(\w+)\s*\}/g;

type Params = Record<string, unknown>;

export default class ValidationErrorNoStack implements ValidationError {
  name: string;
  message: string;
  stack?: string | undefined;
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
    if (typeof message === 'function') return message(params);

    return message;
  }

  constructor(
    errorOrErrors: string | ValidationError | readonly ValidationError[],
    value?: any,
    field?: string,
    type?: string,
  ) {
    this.name = 'ValidationError';
    this.value = value;
    this.path = field;
    this.type = type;

    this.errors = [];
    this.inner = [];

    toArray(errorOrErrors).forEach((err) => {
      if (ValidationError.isError(err)) {
        this.errors.push(...err.errors);
        const innerErrors = err.inner.length ? err.inner : [err];
        this.inner.push(...innerErrors);
      } else {
        this.errors.push(err);
      }
    });

    this.message =
      this.errors.length > 1
        ? `${this.errors.length} errors occurred`
        : this.errors[0];
  }
  [Symbol.toStringTag] = 'Error';
}
