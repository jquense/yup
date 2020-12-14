import isSchema from './util/isSchema';
import type { Callback, ValidateOptions } from './types';
import type { ResolveOptions } from './Condition';

import type {
  AnySchema,
  CastOptions,
  ConfigOf,
  SchemaFieldDescription,
  SchemaLazyDescription,
} from './schema';
import { Config, TypedSchema, TypeOf } from './util/types';

export type LazyBuilder<T extends AnySchema = any> = (
  value: any,
  options: ResolveOptions,
) => T;

export function create<T extends AnySchema>(builder: LazyBuilder<T>) {
  return new Lazy(builder);
}

export type LazyReturnValue<T> = T extends Lazy<infer TSchema>
  ? TSchema
  : never;

export type LazyType<T> = LazyReturnValue<T> extends TypedSchema
  ? TypeOf<LazyReturnValue<T>>
  : never;

export interface LazySpec {
  meta: Record<string, unknown> | undefined;
}

class Lazy<T extends AnySchema, TConfig extends Config = ConfigOf<T>>
  implements TypedSchema {
  type = 'lazy' as const;

  __isYupSchema__ = true;

  readonly __type!: T['__type'];
  readonly __outputType!: T['__outputType'];

  spec: LazySpec;

  constructor(private builder: LazyBuilder<T>) {
    this.spec = { meta: undefined };
  }

  clone(): Lazy<T, TConfig> {
    const next = new Lazy(this.builder);
    next.spec = { ...this.spec };
    return next;
  }

  private _resolve = (
    value: any,
    options: ResolveOptions<TConfig['context']> = {},
  ): T => {
    let schema = this.builder(value, options);

    if (!isSchema(schema))
      throw new TypeError('lazy() functions must return a valid schema');

    return schema.resolve(options);
  };

  resolve(options: ResolveOptions<TConfig['context']>) {
    return this._resolve(options.value, options);
  }

  cast(value: any, options?: CastOptions<TConfig['context']>): T['__type'] {
    return this._resolve(value, options).cast(value, options);
  }

  validate(
    value: any,
    options?: ValidateOptions,
    maybeCb?: Callback,
  ): T['__outputType'] {
    // @ts-expect-error missing public callback on type
    return this._resolve(value, options).validate(value, options, maybeCb);
  }

  validateSync(
    value: any,
    options?: ValidateOptions<TConfig['context']>,
  ): T['__outputType'] {
    return this._resolve(value, options).validateSync(value, options);
  }

  validateAt(
    path: string,
    value: any,
    options?: ValidateOptions<TConfig['context']>,
  ) {
    return this._resolve(value, options).validateAt(path, value, options);
  }

  validateSyncAt(
    path: string,
    value: any,
    options?: ValidateOptions<TConfig['context']>,
  ) {
    return this._resolve(value, options).validateSyncAt(path, value, options);
  }

  isValid(value: any, options?: ValidateOptions<TConfig['context']>) {
    return this._resolve(value, options).isValid(value, options);
  }

  isValidSync(value: any, options?: ValidateOptions<TConfig['context']>) {
    return this._resolve(value, options).isValidSync(value, options);
  }

  describe(
    options?: ResolveOptions<TConfig['context']>,
  ): SchemaLazyDescription | SchemaFieldDescription {
    return options
      ? this.resolve(options).describe(options)
      : { type: 'lazy', meta: this.spec.meta, label: undefined };
  }

  meta(): Record<string, unknown> | undefined;
  meta(obj: Record<string, unknown>): Lazy<T, TConfig>;
  meta(...args: [Record<string, unknown>?]) {
    if (args.length === 0) return this.spec.meta;

    let next = this.clone();
    next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
    return next;
  }
}

export default Lazy;
