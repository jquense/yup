import isSchema from './util/isSchema';
import type {
  AnyObject,
  ISchema,
  ValidateOptions,
  NestedTestConfig,
} from './types';
import type { ResolveOptions } from './Condition';

import type {
  CastOptions,
  SchemaFieldDescription,
  SchemaLazyDescription,
} from './schema';
import { Flags } from './util/types';
import { InferType, Schema } from '.';

export type LazyBuilder<
  TSchema extends ISchema<TContext>,
  TContext = AnyObject,
> = (value: any, options: ResolveOptions) => TSchema;

export function create<
  TSchema extends ISchema<any, TContext>,
  TContext = AnyObject,
>(builder: (value: any, options: ResolveOptions<TContext>) => TSchema) {
  return new Lazy<InferType<TSchema>, TContext>(builder);
}

export interface LazySpec {
  meta: Record<string, unknown> | undefined;
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
    this.spec = { meta: undefined };
  }

  clone(): Lazy<T, TContext, TFlags> {
    const next = new Lazy<T, TContext, TFlags>(this.builder);
    next.spec = { ...this.spec };
    return next;
  }

  private _resolve = (
    value: any,
    options: ResolveOptions<TContext> = {},
  ): Schema<T, TContext, TDefault, TFlags> => {
    let schema = this.builder(value, options) as Schema<
      T,
      TContext,
      TDefault,
      TFlags
    >;

    if (!isSchema(schema))
      throw new TypeError('lazy() functions must return a valid schema');

    return schema.resolve(options);
  };

  resolve(options: ResolveOptions<TContext>) {
    return this._resolve(options.value, options);
  }

  cast(value: any, options?: CastOptions<TContext>): T {
    return this._resolve(value, options).cast(value, options);
  }

  asNestedTest(options: NestedTestConfig) {
    let value = options.parent[options.index ?? options.key!];
    return this._resolve(value, options).asNestedTest(options);
  }

  validate(value: any, options?: ValidateOptions<TContext>): Promise<T> {
    return this._resolve(value, options).validate(value, options);
  }

  validateSync(value: any, options?: ValidateOptions<TContext>): T {
    return this._resolve(value, options).validateSync(value, options);
  }

  validateAt(path: string, value: any, options?: ValidateOptions<TContext>) {
    return this._resolve(value, options).validateAt(path, value, options);
  }

  validateSyncAt(
    path: string,
    value: any,
    options?: ValidateOptions<TContext>,
  ) {
    return this._resolve(value, options).validateSyncAt(path, value, options);
  }

  isValid(value: any, options?: ValidateOptions<TContext>) {
    return this._resolve(value, options).isValid(value, options);
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
  meta(obj: Record<string, unknown>): Lazy<T, TContext, TDefault, TFlags>;
  meta(...args: [Record<string, unknown>?]) {
    if (args.length === 0) return this.spec.meta;

    let next = this.clone();
    next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
    return next;
  }
}

export default Lazy;
