import isSchema from './util/isSchema';
import Schema, { CastOptions } from './Schema';
import { Callback, ValidateOptions } from './types';
import { ResolveOptions } from './Condition';

export type LazyBuilder = <T extends Schema>(
  value: any,
  options: ResolveOptions,
) => T;

export function create(builder: LazyBuilder) {
  return new Lazy(builder);
}

class Lazy implements Schema {
  type = 'lazy' as const;

  __isYupSchema__ = true;

  constructor(private builder: LazyBuilder) {}

  private _resolve = (value: any, options: ResolveOptions) => {
    let schema = this.builder(value, options);

    if (!isSchema(schema))
      throw new TypeError('lazy() functions must return a valid schema');

    return schema.resolve(options);
  };

  resolve(options: ResolveOptions) {
    return this._resolve(options.value, options);
  }
  cast(value: any, options: CastOptions) {
    return this._resolve(value, options).cast(value, options);
  }
  validate(value: any, options: ValidateOptions, maybeCb?: Callback) {
    return this._resolve(value, options).validate(value, options, maybeCb);
  }

  validateSync(value: any, options: ValidateOptions) {
    return this._resolve(value, options).validateSync(value, options);
  }
  validateAt(path: string, value: any, options: ValidateOptions) {
    return this._resolve(value, options).validateAt(path, value, options);
  }
  validateSyncAt(path: string, value: any, options: ValidateOptions) {
    return this._resolve(value, options).validateSyncAt(path, value, options);
  }
  describe() {
    return null as any;
  }
}

export default Lazy;
