import ValidationError from '../ValidationError';
import Ref from '../Reference';
import {
  ValidateOptions,
  Message,
  InternalOptions,
  ExtraParams,
  ISchema,
} from '../types';
import Reference from '../Reference';
import type { AnySchema } from '../schema';
import isAbsent from './isAbsent';

export type PanicCallback = (err: Error) => void;

export type NextCallback = (
  err: ValidationError[] | ValidationError | null,
) => void;

export type CreateErrorOptions = {
  path?: string;
  message?: Message<any>;
  params?: ExtraParams;
  type?: string;
  disableStackTrace?: boolean;
};

export type TestContext<TContext = {}> = {
  path: string;
  options: ValidateOptions<TContext>;
  originalValue: any;
  parent: any;
  from?: Array<{ schema: ISchema<any, TContext>; value: any }>;
  schema: any;
  resolve: <T>(value: T | Reference<T>) => T;
  createError: (params?: CreateErrorOptions) => ValidationError;
};

export type TestFunction<T = unknown, TContext = {}> = (
  this: TestContext<TContext>,
  value: T,
  context: TestContext<TContext>,
) => void | boolean | ValidationError | Promise<boolean | ValidationError>;

export type TestOptions<TSchema extends AnySchema = AnySchema> = {
  value: any;
  path?: string;
  options: InternalOptions;
  originalValue: any;
  schema: TSchema;
};

export type TestConfig<TValue = unknown, TContext = {}> = {
  name?: string;
  message?: Message<any>;
  test: TestFunction<TValue, TContext>;
  params?: ExtraParams;
  exclusive?: boolean;
  skipAbsent?: boolean;
};

export type Test = ((
  opts: TestOptions,
  panic: PanicCallback,
  next: NextCallback,
) => void) & {
  OPTIONS?: TestConfig;
};

export default function createValidation(config: {
  name?: string;
  test: TestFunction;
  params?: ExtraParams;
  message?: Message<any>;
  skipAbsent?: boolean;
}) {
  function validate<TSchema extends AnySchema = AnySchema>(
    { value, path = '', options, originalValue, schema }: TestOptions<TSchema>,
    panic: PanicCallback,
    next: NextCallback,
  ) {
    const { name, test, params, message, skipAbsent } = config;
    let {
      parent,
      context,
      abortEarly = schema.spec.abortEarly,
      disableStackTrace = schema.spec.disableStackTrace,
    } = options;

    function resolve<T>(item: T | Reference<T>) {
      return Ref.isRef(item) ? item.getValue(value, parent, context) : item;
    }

    function createError(overrides: CreateErrorOptions = {}) {
      const nextParams = {
        value,
        originalValue,
        label: schema.spec.label,
        path: overrides.path || path,
        spec: schema.spec,
        disableStackTrace: overrides.disableStackTrace || disableStackTrace,
        ...params,
        ...overrides.params,
      };

      type Keys = (keyof typeof nextParams)[];
      for (const key of Object.keys(nextParams) as Keys)
        nextParams[key] = resolve(nextParams[key]);

      const error = new ValidationError(
        ValidationError.formatError(overrides.message || message, nextParams),
        value,
        nextParams.path,
        overrides.type || name,
        nextParams.disableStackTrace,
      );
      error.params = nextParams;
      return error;
    }

    const invalid = abortEarly ? panic : next;

    let ctx = {
      path,
      parent,
      type: name,
      from: options.from,
      createError,
      resolve,
      options,
      originalValue,
      schema,
    };

    const handleResult = (validOrError: ReturnType<TestFunction>) => {
      if (ValidationError.isError(validOrError)) invalid(validOrError);
      else if (!validOrError) invalid(createError());
      else next(null);
    };

    const handleError = (err: any) => {
      if (ValidationError.isError(err)) invalid(err);
      else panic(err);
    };

    const shouldSkip = skipAbsent && isAbsent(value);

    if (shouldSkip) {
      return handleResult(true);
    }

    let result: ReturnType<TestFunction>;
    try {
      result = test.call(ctx, value, ctx);
      if (typeof (result as any)?.then === 'function') {
        if (options.sync) {
          throw new Error(
            `Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. ` +
              `This test will finish after the validate call has returned`,
          );
        }
        return Promise.resolve(result).then(handleResult, handleError);
      }
    } catch (err: any) {
      handleError(err);
      return;
    }

    handleResult(result);
  }

  validate.OPTIONS = config;

  return validate;
}
