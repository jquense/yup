import isSchema from './util/isSchema';
import Schema, { CastOptions } from './Schema';
import type { Callback, ValidateOptions } from './types';
import type { ResolveOptions } from './Condition';
import MixedSchema, { AnyMixed } from './mixed';

export type LazyBuilder<T extends AnyMixed = any> = (
  value: any,
  options: ResolveOptions,
) => T;

export function create<T extends AnyMixed>(builder: LazyBuilder<T>) {
  return new Lazy(builder);
}

export type LazyReturnValue<T> = T extends Lazy<infer TSchema>
  ? TSchema
  : never;

export type LazyType<T> = LazyReturnValue<T> extends MixedSchema<infer TType>
  ? TType
  : never;

class Lazy<T extends AnyMixed> implements Schema {
  type = 'lazy' as const;

  __isYupSchema__ = true;

  readonly __inputType!: T['__inputType'];
  readonly __outputType!: T['__outputType'];

  constructor(private builder: LazyBuilder<T>) {}

  private _resolve = (value: any, options: ResolveOptions = {}) => {
    let schema = this.builder(value, options);

    if (!isSchema(schema))
      throw new TypeError('lazy() functions must return a valid schema');

    return schema.resolve(options);
  };

  resolve(options: ResolveOptions) {
    return this._resolve(options.value, options);
  }
  cast(value: any, options?: CastOptions): T['__inputType'] {
    return this._resolve(value, options).cast(value, options);
  }

  validate(
    value: any,
    options?: ValidateOptions,
    maybeCb?: Callback,
  ): T['__outputType'] {
    // @ts-expect-error
    return this._resolve(value, options).validate(value, options, maybeCb);
  }

  validateSync(value: any, options?: ValidateOptions): T['__outputType'] {
    return this._resolve(value, options).validateSync(value, options);
  }
  validateAt(path: string, value: any, options?: ValidateOptions) {
    return this._resolve(value, options).validateAt(path, value, options);
  }
  validateSyncAt(path: string, value: any, options?: ValidateOptions) {
    return this._resolve(value, options).validateSyncAt(path, value, options);
  }
  describe() {
    return null as any;
  }
}

export default Lazy;
