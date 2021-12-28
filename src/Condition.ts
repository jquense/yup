import isSchema from './util/isSchema';
import Reference from './Reference';
import type { ISchema } from './util/types';

export interface ConditionBuilder<T extends ISchema<any, any>> {
  (this: T, value: any, schema: T): ISchema<any, any> | void;
  (v1: any, v2: any, schema: T): ISchema<any, any> | void;
  (v1: any, v2: any, v3: any, schema: T): ISchema<any, any> | void;
  (v1: any, v2: any, v3: any, v4: any, schema: T): ISchema<any, any> | void;
}

export type ConditionConfig<T extends ISchema<any>> = {
  is: any | ((...values: any[]) => boolean);
  then?: (schema: T) => ISchema<any>;
  otherwise?: (schema: T) => ISchema<any>;
};

export type ConditionOptions<T extends ISchema<any, any>> =
  | ConditionBuilder<T>
  | ConditionConfig<T>;

export type ResolveOptions<TContext = any> = {
  value?: any;
  parent?: any;
  context?: TContext;
};

class Condition<T extends ISchema<any, any> = ISchema<any, any>> {
  fn: ConditionBuilder<T>;

  constructor(public refs: Reference[], options: ConditionOptions<T>) {
    this.refs = refs;

    if (typeof options === 'function') {
      this.fn = options;
      return;
    }

    if (!('is' in options))
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
      let _opts = args.pop();
      let schema = args.pop();
      let branch = check(...args) ? then : otherwise;

      return branch?.(schema) ?? schema;
    };
  }

  resolve(base: T, options: ResolveOptions) {
    let values = this.refs.map((ref) =>
      // TODO: ? operator here?
      ref.getValue(options?.value, options?.parent, options?.context),
    );

    let schema = this.fn.apply(base, values.concat(base, options) as any);

    if (schema === undefined || schema === base) return base;

    if (!isSchema(schema))
      throw new TypeError('conditions must return a schema object');

    return schema.resolve(options);
  }
}

export default Condition;
