import isSchema from './util/isSchema';
import type { AnyObject, Callback, ValidateOptions } from './types';
import type { ResolveOptions } from './Condition';

import type {
  CastOptions,
  SchemaFieldDescription,
  SchemaLazyDescription,
} from './schema';
import { Flags, ISchema } from './util/types';
import { Schema } from '.';

export type LazyBuilder<
  T,
  TContext = AnyObject,
  TDefault = any,
  TFlags extends Flags = any,
> = (
  value: any,
  options: ResolveOptions,
) => ISchema<T, TContext, TFlags, TDefault>;

export function create<
  T,
  TContext = AnyObject,
  TFlags extends Flags = any,
  TDefault = any,
>(builder: LazyBuilder<T, TContext, TDefault, TFlags>) {
  return new Lazy<T, TContext, TDefault, TFlags>(builder);
}

export interface LazySpec {
  meta: Record<string, unknown> | undefined;
}

class Lazy<T, TContext = AnyObject, TDefault = any, TFlags extends Flags = any>
  implements ISchema<T, TContext, TFlags, TDefault>
{
  type = 'lazy' as const;

  __isYupSchema__ = true;

  declare readonly __outputType: T;
  declare readonly __context: TContext;
  declare readonly __flags: TFlags;
  declare readonly __default: TDefault;

  spec: LazySpec;

  constructor(private builder: LazyBuilder<T, TContext, TDefault, TFlags>) {
    this.spec = { meta: undefined };
  }

  clone(): Lazy<T, TContext, TDefault, TFlags> {
    const next = create(this.builder);
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

  validate(
    value: any,
    options?: ValidateOptions,
    maybeCb?: Callback,
  ): Promise<T> {
    // @ts-expect-error missing public callback on type
    return this._resolve(value, options).validate(value, options, maybeCb);
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
