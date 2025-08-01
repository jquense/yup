import isSchema from './util/isSchema';
import type {
  AnyObject,
  ISchema,
  ValidateOptions,
  NestedTestConfig,
  InferType,
} from './types';
import type { ResolveOptions } from './Condition';

import type {
  CastOptionalityOptions,
  CastOptions,
  SchemaFieldDescription,
  SchemaLazyDescription,
} from './schema';
import { Flags, Maybe, ResolveFlags } from './util/types';
import ValidationError from './ValidationError';
import Schema from './schema';
import {
  issuesFromValidationError,
  StandardResult,
  StandardSchemaProps,
} from './standardSchema';

export type LazyBuilder<
  TSchema extends ISchema<TContext>,
  TContext = AnyObject,
> = (value: any, options: ResolveOptions) => TSchema;

export function create<
  TSchema extends ISchema<any, TContext>,
  TContext extends Maybe<AnyObject> = AnyObject,
>(builder: (value: any, options: ResolveOptions<TContext>) => TSchema) {
  return new Lazy<InferType<TSchema>, TContext>(builder);
}

function catchValidationError(fn: () => any) {
  try {
    return fn();
  } catch (err) {
    if (ValidationError.isError(err)) return Promise.reject(err);
    throw err;
  }
}

export interface LazySpec {
  meta: Record<string, unknown> | undefined;
  optional: boolean;
}

class Lazy<T, TContext = AnyObject, TFlags extends Flags = any>
  implements ISchema<T, TContext, TFlags, undefined>
{
  type = 'lazy' as const;

  __isYupSchema__ = true;

  declare readonly __outputType: T;
  declare readonly __context: TContext;
  declare readonly __flags: TFlags;
  declare readonly __default: undefined;

  spec: LazySpec;

  constructor(private builder: any) {
    this.spec = { meta: undefined, optional: false };
  }

  clone(spec?: Partial<LazySpec>): Lazy<T, TContext, TFlags> {
    const next = new Lazy<T, TContext, TFlags>(this.builder);
    next.spec = { ...this.spec, ...spec };
    return next;
  }

  private _resolve = (
    value: any,
    options: ResolveOptions<TContext> = {},
  ): Schema<T, TContext, undefined, TFlags> => {
    let schema = this.builder(value, options) as Schema<
      T,
      TContext,
      undefined,
      TFlags
    >;

    if (!isSchema(schema))
      throw new TypeError('lazy() functions must return a valid schema');

    if (this.spec.optional) schema = schema.optional();

    return schema.resolve(options);
  };

  private optionality(optional: boolean) {
    const next = this.clone({ optional });
    return next;
  }

  optional(): Lazy<T | undefined, TContext, TFlags> {
    return this.optionality(true);
  }

  resolve(options: ResolveOptions<TContext>) {
    return this._resolve(options.value, options);
  }

  cast(value: any, options?: CastOptions<TContext>): T;
  cast(
    value: any,
    options?: CastOptionalityOptions<TContext>,
  ): T | null | undefined;
  cast(
    value: any,
    options?: CastOptions<TContext> | CastOptionalityOptions<TContext>,
  ): any {
    return this._resolve(value, options).cast(value, options as any);
  }

  asNestedTest(config: NestedTestConfig) {
    let { key, index, parent, options } = config;
    let value = parent[index ?? key!];

    return this._resolve(value, {
      ...options,
      value,
      parent,
    }).asNestedTest(config);
  }

  validate(value: any, options?: ValidateOptions<TContext>): Promise<T> {
    return catchValidationError(() =>
      this._resolve(value, options).validate(value, options),
    );
  }

  validateSync(value: any, options?: ValidateOptions<TContext>): T {
    return this._resolve(value, options).validateSync(value, options);
  }

  validateAt(path: string, value: any, options?: ValidateOptions<TContext>) {
    return catchValidationError(() =>
      this._resolve(value, options).validateAt(path, value, options),
    );
  }

  validateSyncAt(
    path: string,
    value: any,
    options?: ValidateOptions<TContext>,
  ) {
    return this._resolve(value, options).validateSyncAt(path, value, options);
  }

  isValid(value: any, options?: ValidateOptions<TContext>) {
    try {
      return this._resolve(value, options).isValid(value, options);
    } catch (err) {
      if (ValidationError.isError(err)) {
        return Promise.resolve(false);
      }
      throw err;
    }
  }

  isValidSync(value: any, options?: ValidateOptions<TContext>) {
    return this._resolve(value, options).isValidSync(value, options);
  }

  describe(
    options?: ResolveOptions<TContext>,
  ): SchemaLazyDescription | SchemaFieldDescription {
    return options
      ? this.resolve(options).describe(options)
      : { type: 'lazy', meta: this.spec.meta, label: undefined };
  }

  meta(): Record<string, unknown> | undefined;
  meta(obj: Record<string, unknown>): Lazy<T, TContext, TFlags>;
  meta(...args: [Record<string, unknown>?]) {
    if (args.length === 0) return this.spec.meta;

    let next = this.clone();
    next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
    return next;
  }

  get ['~standard']() {
    const schema = this;

    const standard: StandardSchemaProps<
      T,
      ResolveFlags<T, TFlags, undefined>
    > = {
      version: 1,
      vendor: 'yup',
      async validate(
        value: unknown,
      ): Promise<StandardResult<ResolveFlags<T, TFlags, undefined>>> {
        try {
          const result = await schema.validate(value, {
            abortEarly: false,
          });

          return {
            value: result as ResolveFlags<T, TFlags, undefined>,
          };
        } catch (err) {
          if (ValidationError.isError(err)) {
            return {
              issues: issuesFromValidationError(err),
            };
          }

          throw err;
        }
      },
    };

    return standard;
  }
}

export default Lazy;
