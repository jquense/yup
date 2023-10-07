// @ts-ignore

import type {
  AnyObject,
  DefaultThunk,
  InternalOptions,
  ISchema,
  Message,
} from './types';
import type {
  Defined,
  Flags,
  NotNull,
  SetFlag,
  ToggleDefault,
  UnsetFlag,
  Maybe,
} from './util/types';
import type { ResolveOptions } from './Condition';
import Schema, {
  RunTest,
  SchemaInnerTypeDescription,
  SchemaSpec,
} from './schema';
import ValidationError from './ValidationError';
import { tuple as tupleLocale } from './locale';

type AnyTuple = [unknown, ...unknown[]];

export function create<T extends AnyTuple>(schemas: {
  [K in keyof T]: ISchema<T[K]>;
}) {
  return new TupleSchema<T | undefined>(schemas);
}

export default interface TupleSchema<
  TType extends Maybe<AnyTuple> = AnyTuple | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  default<D extends Maybe<TType>>(
    def: DefaultThunk<D, TContext>,
  ): TupleSchema<TType, TContext, D, ToggleDefault<TFlags, D>>;

  concat<TOther extends TupleSchema<any, any>>(schema: TOther): TOther;

  defined(
    msg?: Message,
  ): TupleSchema<Defined<TType>, TContext, TDefault, TFlags>;
  optional(): TupleSchema<TType | undefined, TContext, TDefault, TFlags>;

  required(
    msg?: Message,
  ): TupleSchema<NonNullable<TType>, TContext, TDefault, TFlags>;
  notRequired(): TupleSchema<Maybe<TType>, TContext, TDefault, TFlags>;

  nullable(
    msg?: Message,
  ): TupleSchema<TType | null, TContext, TDefault, TFlags>;
  nonNullable(
    msg?: Message
  ): TupleSchema<NotNull<TType>, TContext, TDefault, TFlags>;

  strip(
    enabled: false,
  ): TupleSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): TupleSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
}

interface TupleSchemaSpec<T> extends SchemaSpec<any> {
  types: T extends any[]
    ? {
        [K in keyof T]: ISchema<T[K]>;
      }
    : never;
}

export default class TupleSchema<
  TType extends Maybe<AnyTuple> = AnyTuple | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  declare spec: TupleSchemaSpec<TType>;

  constructor(schemas: [ISchema<any>, ...ISchema<any>[]]) {
    super({
      type: 'tuple',
      spec: { types: schemas } as any,
      check(v: any): v is NonNullable<TType> {
        const types = (this.spec as TupleSchemaSpec<TType>).types;
        return Array.isArray(v) && v.length === types.length;
      },
    });

    this.withMutation(() => {
      this.typeError(tupleLocale.notType);
    });
  }

  protected _cast(inputValue: any, options: InternalOptions<TContext>) {
    const { types } = this.spec;
    const value = super._cast(inputValue, options);

    if (!this._typeCheck(value)) {
      return value;
    }

    let isChanged = false;
    const castArray = types.map((type, idx) => {
      const castElement = type.cast(value[idx], {
        ...options,
        path: `${options.path || ''}[${idx}]`,
      });
      if (castElement !== value[idx]) isChanged = true;
      return castElement;
    });

    return isChanged ? castArray : value;
  }

  protected _validate(
    _value: any,
    options: InternalOptions<TContext> = {},
    panic: (err: Error, value: unknown) => void,
    next: (err: ValidationError[], value: unknown) => void,
  ) {
    let itemTypes = this.spec.types;

    super._validate(_value, options, panic, (tupleErrors, value) => {
      // intentionally not respecting recursive
      if (!this._typeCheck(value)) {
        next(tupleErrors, value);
        return;
      }

      let tests: RunTest[] = [];
      for (let [index, itemSchema] of itemTypes.entries()) {
        tests[index] = itemSchema!.asNestedTest({
          options,
          index,
          parent: value,
          parentPath: options.path,
          originalParent: options.originalValue ?? _value,
        });
      }

      this.runTests(
        {
          value,
          tests,
          originalValue: options.originalValue ?? _value,
          options,
        },
        panic,
        (innerTypeErrors) => next(innerTypeErrors.concat(tupleErrors), value),
      );
    });
  }

  describe(options?: ResolveOptions<TContext>) {
    const next = (options ? this.resolve(options) : this).clone();
    const base = super.describe(options) as SchemaInnerTypeDescription;
    base.innerType = next.spec.types.map((schema, index) => {
      let innerOptions = options;
      if (innerOptions?.value) {
        innerOptions = {
          ...innerOptions,
          parent: innerOptions.value,
          value: innerOptions.value[index],
        };
      }
      return schema.describe(innerOptions);
    });
    return base;
  }
}

create.prototype = TupleSchema.prototype;
