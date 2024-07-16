import isSchema from './util/isSchema';
import type {
  AnyObject,
  ISchema,
  ValidateOptions,
  NestedTestConfig,
} from './types';
import type { ResolveOptions } from './Condition';

import type {
  CastOptionalityOptions,
  CastOptions,
  SchemaFieldDescription,
  SchemaLazyDescription,
} from './schema';
import { Flags, Maybe } from './util/types';
import { InferType, Schema } from '.';

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

export interface LazySpec {
  meta: Record<string, unknown> | undefined;
  optional: boolean;
}

type SchemaMetadata = Record<string, unknown>;

type SchemaMetadataMutator = (obj: SchemaMetadata) => SchemaMetadata;

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

  meta(): SchemaMetadata | undefined;
  meta(fn: SchemaMetadataMutator): Lazy<T, TContext, TFlags>;
  meta(obj: SchemaMetadata): Lazy<T, TContext, TFlags>;
  meta(...args: [(SchemaMetadata | SchemaMetadataMutator)?]) {
    if (args.length === 0) return this.spec.meta;

    if (typeof args[0] === 'function') {
      const schemaMutator = args[0] as SchemaMetadataMutator;
      const next = this.clone();
      next.spec.meta = schemaMutator(next.spec.meta || {});
      return next;
    }
    const next = this.clone();
    next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
    return next;
  }
}

export default Lazy;
