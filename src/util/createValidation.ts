import ValidationError from '../ValidationError';
import Ref from '../Reference';
import {
  ValidateOptions,
  Message,
  InternalOptions,
  ExtraParams,
} from '../types';
import Reference from '../Reference';
import type { AnySchema } from '../schema';
import { ISchema } from './types';

export type PanicCallback = (err: Error) => void;

export type NextCallback = (
  err: ValidationError[] | ValidationError | null,
) => void;

export type CreateErrorOptions = {
  path?: string;
  message?: Message<any>;
  params?: ExtraParams;
  type?: string;
};

export type TestContext<TContext = {}> = {
  path: string;
  options: ValidateOptions<TContext>;
  originalValue: any;
  parent: any;
  from?: Array<{ schema: ISchema<any, TContext>; value: any }>;
  schema: any; // TODO: Schema<any>;
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
  label?: string;
  options: InternalOptions;
  originalValue: any;
  schema: TSchema;
  sync?: boolean;
};

export type TestConfig<TValue = unknown, TContext = {}> = {
  name?: string;
  message?: Message<any>;
  test: TestFunction<TValue, TContext>;
  params?: ExtraParams;
  exclusive?: boolean;
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
}) {
  function validate<TSchema extends AnySchema = AnySchema>(
    {
      value,
      path = '',
      label,
      options,
      originalValue,
      sync,
      ...rest
    }: TestOptions<TSchema>,
    panic: PanicCallback,
    next: NextCallback,
  ) {
    const { name, test, params, message } = config;
    let { parent, context, abortEarly = rest.schema.spec.abortEarly } = options;

    function resolve<T>(item: T | Reference<T>) {
      return Ref.isRef(item) ? item.getValue(value, parent, context) : item;
    }

    function createError(overrides: CreateErrorOptions = {}) {
      const nextParams = {
        value,
        originalValue,
        label,
        path: overrides.path || path,
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
      );
      error.params = nextParams;
      return error;
    }

    // function handleResult(validOrError: Error | boolean | void) {
    //   if (!ValidationError.isError(validOrError)) panic(validOrError);
    // }
    const invalid = abortEarly ? panic : next;

    let ctx = {
      path,
      parent,
      type: name,
      createError,
      resolve,
      options,
      originalValue,
      ...rest,
    };

    const handleResult = (validOrError: ReturnType<TestFunction>) => {
      if (ValidationError.isError(validOrError)) invalid(validOrError);
      else if (!validOrError) invalid(createError());
      else next(null);
    };

    const catchError = (err: any) => {
      if (ValidationError.isError(err)) invalid(err);
      else panic(err);
    };

    if (!sync) {
      try {
        Promise.resolve(test.call(ctx, value, ctx))
          .then(handleResult)
          .catch(catchError);
      } catch (err: any) {
        catchError(err);
      }

      return;
    }

    let result: ReturnType<TestFunction>;
    try {
      result = test.call(ctx, value, ctx);

      if (typeof (result as any)?.then === 'function') {
        throw new Error(
          `Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. ` +
            `This test will finish after the validate call has returned`,
        );
      }
    } catch (err: any) {
      catchError(err);
      return;
    }

    handleResult(result);
  }

  validate.OPTIONS = config;

  return validate;
}
