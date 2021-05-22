import isAbsent from './util/isAbsent';
import isSchema from './util/isSchema';
import printValue from './util/printValue';
import { array as locale, MixedLocale } from './locale';
import runTests, { RunTest } from './util/runTests';
import type {
  AnyObject,
  InternalOptions,
  Callback,
  Message,
  Maybe,
  Preserve,
  Optionals,
} from './types';
import ValidationError from './ValidationError';
import type Reference from './Reference';
import { Asserts, Defined, If, Thunk, TypeOf } from './util/types';
import BaseSchema, {
  AnySchema,
  SchemaInnerTypeDescription,
  SchemaSpec,
} from './schema';
import Lazy from './Lazy';

export type RejectorFn = (value: any, index: number, array: any[]) => boolean;

export function create<
  C extends AnyObject = AnyObject,
  T extends AnySchema | Lazy<any, any> = AnySchema
>(type?: T) {
  return new ArraySchema<T, C>(type) as OptionalArraySchema<T, C>;
}

export default class ArraySchema<
  T extends AnySchema | Lazy<any, any>,
  C extends AnyObject = AnyObject,
  TIn extends Maybe<TypeOf<T>[]> = TypeOf<T>[] | undefined,
  TOut extends Maybe<Asserts<T>[]> = Asserts<T>[] | Optionals<TIn>
> extends BaseSchema<TIn, C, TOut> {
  innerType?: T;

  constructor(type?: T) {
    super({ type: 'array' });

    // `undefined` specifically means uninitialized, as opposed to
    // "no subtype"
    this.innerType = type;

    this.withMutation(() => {
      this.transform(function (values) {
        if (typeof values === 'string')
          try {
            values = JSON.parse(values);
          } catch (err) {
            values = null;
          }

        return this.isType(values) ? values : null;
      });
    });
  }

  protected _typeCheck(v: any): v is NonNullable<TIn> {
    return Array.isArray(v);
  }

  private get _subType() {
    return this.innerType;
  }

  protected _cast(_value: any, _opts: InternalOptions<C>) {
    const value = super._cast(_value, _opts);

    //should ignore nulls here
    if (!this._typeCheck(value) || !this.innerType) return value;

    let isChanged = false;
    const castArray = value.map((v, idx) => {
      const castElement = this.innerType!.cast(v, {
        ..._opts,
        path: `${_opts.path || ''}[${idx}]`,
      });
      if (castElement !== v) {
        isChanged = true;
      }

      return castElement;
    });

    return isChanged ? castArray : value;
  }

  protected _validate(
    _value: any,
    options: InternalOptions<C> = {},
    callback: Callback,
  ) {
    let errors = [] as ValidationError[];
    let sync = options.sync;
    let path = options.path;
    let innerType = this.innerType;
    let endEarly = options.abortEarly ?? this.spec.abortEarly;
    let recursive = options.recursive ?? this.spec.recursive;

    let originalValue =
      options.originalValue != null ? options.originalValue : _value;

    super._validate(_value, options, (err, value) => {
      if (err) {
        if (!ValidationError.isError(err) || endEarly) {
          return void callback(err, value);
        }
        errors.push(err);
      }

      if (!recursive || !innerType || !this._typeCheck(value)) {
        callback(errors[0] || null, value);
        return;
      }

      originalValue = originalValue || value;

      // #950 Ensure that sparse array empty slots are validated
      let tests: RunTest[] = new Array(value.length);
      for (let idx = 0; idx < value.length; idx++) {
        let item = value[idx];
        let path = `${options.path || ''}[${idx}]`;

        // object._validate note for isStrict explanation
        let innerOptions = {
          ...options,
          path,
          strict: true,
          parent: value,
          index: idx,
          originalValue: originalValue[idx],
        };

        tests[idx] = (_, cb) => innerType!.validate(item, innerOptions, cb);
      }

      runTests(
        {
          sync,
          path,
          value,
          errors,
          endEarly,
          tests,
        },
        callback,
      );
    });
  }

  clone(spec?: SchemaSpec<any>) {
    const next = super.clone(spec);
    next.innerType = this.innerType;
    return next;
  }

  concat<TOther extends ArraySchema<any, any, any, any>>(
    schema: TOther,
  ): TOther;
  concat(schema: any): any;
  concat(schema: any): any {
    let next = super.concat(schema) as this;

    next.innerType = this.innerType;

    if (schema.innerType)
      next.innerType = next.innerType
        ? // @ts-expect-error Lazy doesn't have concat()
          next.innerType.concat(schema.innerType)
        : schema.innerType;

    return next;
  }

  of<TInner extends AnySchema>(schema: TInner): ArraySchema<TInner> {
    // FIXME: this should return a new instance of array without the default to be
    let next = this.clone();

    if (!isSchema(schema))
      throw new TypeError(
        '`array.of()` sub-schema must be a valid yup schema not: ' +
          printValue(schema),
      );

    // FIXME(ts):
    next.innerType = schema as any;

    return next as any;
  }

  length(
    length: number | Reference<number>,
    message: Message<{ length: number }>,
  ) {
    return this.test({
      message: () => message || locale.length,
      name: 'length',
      exclusive: true,
      params: { length },
      test(value) {
        return isAbsent(value) || value.length === this.resolve(length);
      },
    });
  }

  min(min: number | Reference<number>, message?: Message<{ min: number }>) {

    return this.test({
      message: () => message || locale.min,
      name: 'min',
      exclusive: true,
      params: { min },
      // FIXME(ts): Array<typeof T>
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min);
      },
    });
  }

  max(max: number | Reference<number>, message?: Message<{ max: number }>) {
    return this.test({
      message: () => message || locale.max,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max);
      },
    });
  }

  ensure(): RequiredArraySchema<T, C, TIn> {
    return this.default(() => ([] as any) as TIn).transform(
      (val: TIn, original: any) => {
        // We don't want to return `null` for nullable schema
        if (this._typeCheck(val)) return val;
        return original == null ? [] : [].concat(original);
      },
    ) as any;
  }

  compact(rejector?: RejectorFn) {
    let reject: RejectorFn = !rejector
      ? (v) => !!v
      : (v, i, a) => !rejector(v, i, a);

    return this.transform((values: any[]) =>
      values != null ? values.filter(reject) : values,
    );
  }

  describe() {
    let base = super.describe() as SchemaInnerTypeDescription;
    if (this.innerType) base.innerType = this.innerType.describe();
    return base;
  }

  nullable(isNullable?: true): ArraySchema<T, C, TIn | null>;
  nullable(isNullable: false): ArraySchema<T, C, Exclude<TIn, null>>;
  nullable(isNullable = true): ArraySchema<T, C, TIn | null> {
    return super.nullable(isNullable as any);
  }

  defined(): DefinedArraySchema<T, C, TIn> {
    return super.defined();
  }

  required(msg?: MixedLocale['required']): RequiredArraySchema<T, C, TIn> {
    return super.required(msg);
  }
}

create.prototype = ArraySchema.prototype;

//
// Interfaces
//

export interface DefinedArraySchema<
  T extends AnySchema | Lazy<any, any>,
  TContext extends AnyObject,
  TIn extends Maybe<TypeOf<T>[]>
> extends ArraySchema<T, TContext, TIn, Asserts<T>[] | Preserve<TIn, null>> {
  default<D extends Maybe<TIn>>(
    def: Thunk<D>,
  ): If<
    D,
    DefinedArraySchema<T, TContext, TIn | undefined>,
    DefinedArraySchema<T, TContext, Defined<TIn>>
  >;

  defined(msg?: MixedLocale['defined']): this;
  required(
    msg?: MixedLocale['required'],
  ): RequiredArraySchema<T, TContext, TIn>;
  optional(): ArraySchema<T, TContext, TIn>;
  notRequired(): ArraySchema<T, TContext, TIn>;
  nullable(isNullable?: true): DefinedArraySchema<T, TContext, TIn | null>;
  nullable(
    isNullable: false,
  ): RequiredArraySchema<T, TContext, Exclude<TIn, null>>;
}

export interface RequiredArraySchema<
  T extends AnySchema | Lazy<any, any>,
  TContext extends AnyObject,
  TIn extends Maybe<TypeOf<T>[]>
> extends ArraySchema<T, TContext, TIn, Asserts<T>[]> {
  default<D extends Maybe<TIn>>(
    def: Thunk<D>,
  ): If<
    D,
    RequiredArraySchema<T, TContext, TIn | undefined>,
    RequiredArraySchema<T, TContext, Defined<TIn>>
  >;

  defined(msg?: MixedLocale['defined']): DefinedArraySchema<T, TContext, TIn>;
  required(msg?: MixedLocale['required']): this;
  optional(): ArraySchema<T, TContext, TIn>;
  notRequired(): ArraySchema<T, TContext, TIn>;
  nullable(isNullable?: true): RequiredArraySchema<T, TContext, TIn | null>;
  nullable(
    isNullable: false,
  ): RequiredArraySchema<T, TContext, Exclude<TIn, null>>;
}

export interface OptionalArraySchema<
  T extends AnySchema | Lazy<any, any>,
  TContext extends AnyObject = AnyObject,
  TIn extends Maybe<TypeOf<T>[]> = TypeOf<T>[] | undefined
> extends ArraySchema<T, TContext, TIn> {
  default<D extends Maybe<TIn>>(
    def: Thunk<D>,
  ): If<
    D,
    ArraySchema<T, TContext, TIn | undefined>,
    ArraySchema<T, TContext, Defined<TIn>>
  >;

  defined(msg?: MixedLocale['defined']): DefinedArraySchema<T, TContext, TIn>;
  required(
    msg?: MixedLocale['required'],
  ): RequiredArraySchema<T, TContext, TIn>;

  optional(): ArraySchema<T, TContext, TIn>;
  notRequired(): ArraySchema<T, TContext, TIn>;

  nullable(isNullable?: true): OptionalArraySchema<T, TContext, TIn | null>;
  nullable(
    isNullable: false,
  ): OptionalArraySchema<T, TContext, Exclude<TIn, null>>;
}
