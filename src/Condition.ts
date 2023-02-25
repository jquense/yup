import isSchema from './util/isSchema';
import Reference from './Reference';
import type { ISchema } from './types';

export type ConditionBuilder<T extends ISchema<any, any>> = (
  values: any[],
  schema: T,
  options: ResolveOptions,
) => ISchema<any>;

export type ConditionConfig<T extends ISchema<any>> = {
  is: any | ((...values: any[]) => boolean);
  then?: (schema: T) => ISchema<any>;
  otherwise?: (schema: T) => ISchema<any>;
};

export type ResolveOptions<TContext = any> = {
  value?: any;
  parent?: any;
  context?: TContext;
};

class Condition<TIn extends ISchema<any, any> = ISchema<any, any>> {
  fn: ConditionBuilder<TIn>;

  static fromOptions<TIn extends ISchema<any, any>>(
    refs: Reference[],
    config: ConditionConfig<TIn>,
  ) {
    if (!config.then && !config.otherwise)
      throw new TypeError(
        'either `then:` or `otherwise:` is required for `when()` conditions',
      );

    let { is, then, otherwise } = config;

    let check =
      typeof is === 'function'
        ? is
        : (...values: any[]) => values.every((value) => value === is);

    return new Condition<TIn>(refs, (values, schema: any) => {
      let branch = check(...values) ? then : otherwise;

      return branch?.(schema) ?? schema;
    });
  }

  constructor(
    public refs: readonly Reference[],
    builder: ConditionBuilder<TIn>,
  ) {
    this.refs = refs;
    this.fn = builder;
  }

  resolve(base: TIn, options: ResolveOptions) {
    let values = this.refs.map((ref) =>
      // TODO: ? operator here?
      ref.getValue(options?.value, options?.parent, options?.context),
    );

    let schema = this.fn(values, base, options);

    if (
      schema === undefined ||
      // @ts-ignore this can be base
      schema === base
    ) {
      return base;
    }

    if (!isSchema(schema))
      throw new TypeError('conditions must return a schema object');

    return schema.resolve(options);
  }
}

export default Condition;
