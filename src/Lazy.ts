import isSchema from './util/isSchema';
import type { Callback, ValidateOptions } from './types';
import type { ResolveOptions } from './Condition';

import type { AnySchema, CastOptions } from './schema';
import { TypedSchema, TypeOf } from './util/types';

type ContextOf<T> = T extends AnySchema<any, infer C> ? C : never;

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

class Lazy<T extends AnySchema, TContext = ContextOf<T>>
  implements TypedSchema {
  type = 'lazy' as const;

  __isYupSchema__ = true;

  readonly __type!: T['__type'];
  readonly __out!: T['__out'];

  constructor(private builder: LazyBuilder<T>) {}

  private _resolve = (
    value: any,
    options: ResolveOptions<TContext> = {},
  ): T => {
    let schema = this.builder(value, options);

    if (!isSchema(schema))
      throw new TypeError('lazy() functions must return a valid schema');

    return schema.resolve(options);
  };

  resolve(options: ResolveOptions<TContext>) {
    return this._resolve(options.value, options);
  }
  cast(value: any, options?: CastOptions<TContext>): T['__type'] {
    return this._resolve(value, options).cast(value, options);
  }

  validate(
    value: any,
    options?: ValidateOptions,
    maybeCb?: Callback,
  ): T['__out'] {
    // @ts-expect-error missing public callback on type
    return this._resolve(value, options).validate(value, options, maybeCb);
  }

  validateSync(value: any, options?: ValidateOptions<TContext>): T['__out'] {
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
  describe() {
    return null as any;
  }
}

export default Lazy;
