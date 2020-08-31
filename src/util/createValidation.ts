import mapValues from 'lodash/mapValues';
import ValidationError from '../ValidationError';
import Ref from '../Reference';
import {
  ValidateOptions,
  Message,
  InternalOptions,
  Callback,
  MessageParams,
  AnyMessageParams,
  ExtraParams,
} from '../types';
import Schema from '../Schema';

export type CreateErrorOptions = {
  path?: string;
  message?: string;
  params?: object;
  type?: string;
};

export type TestContext = {
  path: string;
  options: ValidateOptions;
  parent: any;
  schema: any; // TODO: Schema<any>;
  resolve: <T = any>(value: any) => T;
  createError: (params?: CreateErrorOptions) => ValidationError;
};

export type TestFunction<T = unknown> = (
  this: TestContext,
  value: T,
) => boolean | ValidationError | Promise<boolean | ValidationError>;

export type TestOptions<TSchema extends Schema = Schema> = {
  value: any;
  path?: string;
  label?: string;
  options: InternalOptions;
  originalValue: any;
  schema: TSchema;
  sync?: boolean;
};

export type TestConfig = {
  name?: string;
  message?: Message;
  test: TestFunction;
  params?: ExtraParams;
  exclusive?: boolean;
};

export type Test = ((opts: TestOptions, cb: Callback) => void) & {
  OPTIONS: TestConfig;
};

export default function createValidation(config: {
  name?: string;
  test: TestFunction;
  params?: ExtraParams;
  message?: Message;
}) {
  function validate<TSchema extends Schema = Schema>(
    {
      value,
      path = '',
      label,
      options,
      originalValue,
      sync,
      ...rest
    }: TestOptions<TSchema>,
    cb: Callback,
  ) {
    const { name, test, params, message } = config;
    let { parent, context } = options;

    function resolve(item: any) {
      return Ref.isRef(item) ? item.getValue(value, parent, context) : item;
    }

    function createError(overrides: CreateErrorOptions = {}) {
      const nextParams = mapValues(
        {
          value,
          originalValue,
          label,
          path: overrides.path || path,
          ...params,
          ...overrides.params,
        },
        resolve,
      );

      const error = new ValidationError(
        ValidationError.formatError(overrides.message || message, nextParams),
        value,
        nextParams.path,
        overrides.type || name,
      );
      error.params = nextParams;
      return error;
    }

    let ctx = {
      path,
      parent,
      type: name,
      createError,
      resolve,
      options,
      ...rest,
    };

    if (!sync) {
      try {
        Promise.resolve(test.call(ctx, value)).then((validOrError) => {
          if (ValidationError.isError(validOrError)) cb(validOrError);
          else if (!validOrError) cb(createError());
          else cb(null, validOrError);
        });
      } catch (err) {
        cb(err);
      }

      return;
    }

    let result;
    try {
      result = test.call(ctx, value);

      if (typeof (result as any)?.then === 'function') {
        throw new Error(
          `Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. ` +
            `This test will finish after the validate call has returned`,
        );
      }
    } catch (err) {
      cb(err);
      return;
    }

    if (ValidationError.isError(result)) cb(result);
    else if (!result) cb(createError());
    else cb(null, result);
  }

  validate.OPTIONS = config;

  return validate;
}
