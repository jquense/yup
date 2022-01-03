import isSchema from './util/isSchema';
import Reference from './Reference';
import type { ISchema } from './types';

export type ConditionBuilder<
  T extends ISchema<any, any>,
  U extends ISchema<any, any> = T,
> = (values: any[], schema: T, options: ResolveOptions) => U;

export type ConditionConfig<
  T extends ISchema<any>,
  TThen extends ISchema<any, any> = T,
  TOtherwise extends ISchema<any, any> = T,
> = {
  is: any | ((...values: any[]) => boolean);
  then?: (schema: T) => TThen;
  otherwise?: (schema: T) => TOtherwise;
};

export type ResolveOptions<TContext = any> = {
  value?: any;
  parent?: any;
  context?: TContext;
};

class Condition<
  TIn extends ISchema<any, any> = ISchema<any, any>,
  TOut extends ISchema<any, any> = TIn,
> {
  fn: ConditionBuilder<TIn, TOut>;

  static fromOptions<
    TIn extends ISchema<any, any>,
    TThen extends ISchema<any, any>,
    TOtherwise extends ISchema<any, any>,
  >(refs: Reference[], config: ConditionConfig<TIn, TThen, TOtherwise>) {
    if (!config.then && !config.otherwise)
      throw new TypeError(
        'either `then:` or `otherwise:` is required for `when()` conditions',
      );

    let { is, then, otherwise } = config;

    let check =
      typeof is === 'function'
        ? is
        : (...values: any[]) => values.every((value) => value === is);

    return new Condition<TIn, TThen | TOtherwise>(
      refs,
      (values, schema: any) => {
        let branch = check(...values) ? then : otherwise;

        return branch?.(schema) ?? schema;
      },
    );
  }

  constructor(
    public refs: readonly Reference[],
    builder: ConditionBuilder<TIn, TOut>,
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
