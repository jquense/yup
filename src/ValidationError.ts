import printValue from './util/printValue';
import toArray from './util/toArray';

let strReg = /\$\{\s*(\w+)\s*\}/g;

type Params = Record<string, unknown>;

class ValidationErrorNoStack implements ValidationError {
  name: string;
  message: string;

  value: any;
  path?: string;
  type?: string;
  params?: Params;

  errors: string[];
  inner: ValidationError[];

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

export default class ValidationError extends Error {
  value: any;
  path?: string;
  type?: string;
  params?: Params;

  errors: string[] = [];
  inner: ValidationError[] = [];

  static formatError(
    message: string | ((params: Params) => string) | unknown,
    params: Params,
  ) {
    // Attempt to make the path more friendly for error message interpolation.
    const path = params.label || params.path || 'this';
    // Store the original path under `originalPath` so it isn't lost to custom
    // message functions; e.g., ones provided in `setLocale()` calls.
    params = { ...params, path, originalPath: params.path };

    if (typeof message === 'string')
      return message.replace(strReg, (_, key) => printValue(params[key]));
    if (typeof message === 'function') return message(params);

    return message;
  }

  static isError(err: any): err is ValidationError {
    return err && err.name === 'ValidationError';
  }

  constructor(
    errorOrErrors: string | ValidationError | readonly ValidationError[],
    value?: any,
    field?: string,
    type?: string,
    disableStack?: boolean,
  ) {
    const errorNoStack = new ValidationErrorNoStack(
      errorOrErrors,
      value,
      field,
      type,
    );

    if (disableStack) {
      return errorNoStack;
    }

    super();

    this.name = errorNoStack.name;
    this.message = errorNoStack.message;
    this.type = errorNoStack.type;
    this.value = errorNoStack.value;
    this.path = errorNoStack.path;
    this.errors = errorNoStack.errors;
    this.inner = errorNoStack.inner;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  static [Symbol.hasInstance](inst: any) {
    return (
      ValidationErrorNoStack[Symbol.hasInstance](inst) ||
      super[Symbol.hasInstance](inst)
    );
  }

  [Symbol.toStringTag] = 'Error';
}
