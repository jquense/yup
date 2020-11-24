import isAbsent from './util/isAbsent';
import isSchema from './util/isSchema';
import printValue from './util/printValue';
import { array as locale, MixedLocale } from './locale';
import runTests, { RunTest } from './util/runTests';
import type {
  InternalOptions,
  Callback,
  Message,
  Maybe,
  PreserveOptionals,
} from './types';
import ValidationError from './ValidationError';
import type Reference from './Reference';
import {
  Asserts,
  Defined,
  Presence,
  StrictNonNullable,
  TypeOf,
  Unset,
} from './util/types';
import BaseSchema, {
  AnyBase,
  SchemaInnerTypeDescription,
  SchemaSpec,
} from './Base';

type RejectorFn = (value: any, index: number, array: any[]) => boolean;

export function create<TInner extends AnyBase = AnyBase>(type?: TInner) {
  return new ArraySchema<TInner>(type);
}

export default class ArraySchema<
  T extends AnyBase = AnyBase,
  TType extends Maybe<TypeOf<T>[]> = TypeOf<T>[] | undefined,
  TOut extends Maybe<Asserts<T>[]> = Asserts<T>[] | undefined,
  TPresence extends Presence = Unset
> extends BaseSchema<TType, TOut, TPresence> {
  innerType: T | undefined;

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

  protected _typeCheck(v: any): v is NonNullable<TType> {
    return Array.isArray(v);
  }

  private get _subType() {
    return this.innerType;
  }

  protected _cast(_value: any, _opts: InternalOptions) {
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
    options: InternalOptions = {},
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

        tests[idx] = (_, cb) =>
          innerType!.validate(
            item,
            innerOptions,
            // @ts-expect-error
            cb,
          );
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

  concat<TOther extends ArraySchema<T, any, any, any>>(
    schema: TOther,
  ): TOther extends ArraySchema<infer TO, infer C, infer O, infer P>
    ? // hoooo boy
      ArraySchema<
        T,
        | (TypeOf<TO> & TypeOf<T>)[]
        | PreserveOptionals<TType>
        | PreserveOptionals<C>,
        | (Asserts<TO> & Asserts<T>)[]
        | PreserveOptionals<TOut>
        | PreserveOptionals<O>,
        P extends Unset ? TPresence : P
      >
    : never;
  concat(schema: any): any;
  concat(schema: any): any {
    let next = super.concat(schema) as this;

    next.innerType = this.innerType;

    if (schema.innerType)
      next.innerType = next.innerType
        ? next.innerType.concat(schema.innerType)
        : schema.innerType;

    return next;
  }

  of<TInner extends AnyBase>(
    schema: TInner,
  ): ArraySchema<
    TInner,
    TypeOf<TInner>[] | PreserveOptionals<TType>,
    TypeOf<TInner>[] | PreserveOptionals<TOut>,
    TPresence
  > {
    // FIXME: this should return a new instance of array without the default to be
    var next = this.clone();

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
    message: Message<{ length: number }> = locale.length,
  ) {
    return this.test({
      message,
      name: 'length',
      exclusive: true,
      params: { length },
      test(value) {
        return isAbsent(value) || value.length === this.resolve(length);
      },
    });
  }

  min(min: number | Reference<number>, message?: Message<{ min: number }>) {
    message = message || locale.min;

    return this.test({
      message,
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
    message = message || locale.max;
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max);
      },
    });
  }

  ensure(): ArraySchema<T, NonNullable<TType>, NonNullable<TOut>, TPresence> {
    return this.default<TypeOf<T>[]>(() => []).transform((val, original) => {
      // We don't want to return `null` for nullable schema
      if (this._typeCheck(val)) return val;
      return original == null ? [] : [].concat(original);
    }) as any;
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
}

export default interface ArraySchema<
  T extends AnyBase,
  TType extends Maybe<TypeOf<T>[]>,
  TOut extends Maybe<Asserts<T>[]>,
  TPresence extends Presence = Unset
> extends BaseSchema<TType, TOut, TPresence> {
  defined(msg?: MixedLocale['defined']): ArraySchema<T, TType, TOut, 'defined'>;
  required(
    msg?: MixedLocale['required'],
  ): ArraySchema<T, TType, TOut, 'required'>;
  notRequired(): ArraySchema<T, TType, TOut, 'optional'>;

  nullable(
    isNullable?: true,
  ): ArraySchema<T, TType | null, TOut | null, TPresence>;
  nullable(
    isNullable: false,
  ): ArraySchema<
    T,
    StrictNonNullable<TType>,
    StrictNonNullable<TOut>,
    TPresence
  >;
  nullable(isNullable?: boolean): ArraySchema<T, TType, TOut, TPresence>;

  default<TNextDefault extends TypeOf<T>[] | null | undefined>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? ArraySchema<T, TType | undefined, TOut | undefined, TPresence>
    : ArraySchema<T, Defined<TType>, Defined<TOut>, TPresence>;
}
