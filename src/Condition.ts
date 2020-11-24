import has from 'lodash/has';
import isSchema from './util/isSchema';
import Reference from './Reference';
import { SchemaLike } from './types';

export interface ConditionBuilder<T extends SchemaLike> {
  (this: T, value: any, schema: T): SchemaLike;
  (v1: any, v2: any, schema: T): SchemaLike;
  (v1: any, v2: any, v3: any, schema: T): SchemaLike;
  (v1: any, v2: any, v3: any, v4: any, schema: T): SchemaLike;
}

export type ConditionConfig<T extends SchemaLike> = {
  is: any | ((...values: any[]) => boolean);
  then?: SchemaLike | ((schema: T) => SchemaLike);
  otherwise?: SchemaLike | ((schema: T) => SchemaLike);
};

export type ConditionOptions<T extends SchemaLike> =
  | ConditionBuilder<T>
  | ConditionConfig<T>;

export type ResolveOptions = {
  value?: any;
  parent?: any;
  context?: any;
};

class Condition<T extends SchemaLike = SchemaLike> {
  fn: ConditionBuilder<T>;

  constructor(public refs: Reference[], options: ConditionOptions<T>) {
    this.refs = refs;

    if (typeof options === 'function') {
      this.fn = options;
      return;
    }

    if (!has(options, 'is'))
      throw new TypeError('`is:` is required for `when()` conditions');

    if (!options.then && !options.otherwise)
      throw new TypeError(
        'either `then:` or `otherwise:` is required for `when()` conditions',
      );

    let { is, then, otherwise } = options;

    let check =
      typeof is === 'function'
        ? is
        : (...values: any[]) => values.every((value) => value === is);

    this.fn = function (...args: any[]) {
      let options = args.pop();
      let schema = args.pop();
      let branch = check(...args) ? then : otherwise;

      if (!branch) return undefined;
      if (typeof branch === 'function') return branch(schema);
      return schema.concat(branch.resolve(options));
    };
  }

  resolve(base: T, options: ResolveOptions) {
    let values = this.refs.map((ref) =>
      ref.getValue(options?.value, options?.parent, options?.context),
    );

    let schema = this.fn.apply(base, values.concat(base, options));

    if (schema === undefined || schema === base) return base;

    if (!isSchema(schema))
      throw new TypeError('conditions must return a schema object');

    return schema.resolve(options);
  }
}

export default Condition;
