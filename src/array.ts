import isAbsent from './util/isAbsent';
import isSchema from './util/isSchema';
import printValue from './util/printValue';
import { array as locale } from './locale';
import runTests, { RunTest } from './util/runTests';
import type {
  AnyObject,
  InternalOptions,
  Callback,
  Message,
  Maybe,
} from './types';
import ValidationError from './ValidationError';
import type Reference from './Reference';
import {
  Defined,
  Flags,
  NotNull,
  SetFlag,
  Thunk,
  ToggleDefault,
  ISchema,
} from './util/types';
import BaseSchema, { SchemaInnerTypeDescription, SchemaSpec } from './schema';
import { ResolveOptions } from './Condition';

export type RejectorFn = (value: any, index: number, array: any[]) => boolean;

export function create<C extends AnyObject = AnyObject, T = any>(
  type?: ISchema<T, C>,
) {
  return new ArraySchema<T, C>(type as any);
}

export default class ArraySchema<
  T,
  TContext,
  TDefault = undefined,
  TFlags extends Flags = '',
  TIn extends any[] | null | undefined = T[] | undefined,
> extends BaseSchema<TIn, TContext, TDefault, TFlags> {
  innerType?: ISchema<T, TContext>;

  constructor(type?: ISchema<T, TContext>) {
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

  protected _cast(_value: any, _opts: InternalOptions<TContext>) {
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
    options: InternalOptions<TContext> = {},
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

  concat<TOther extends ArraySchema<any, any, any>>(schema: TOther): TOther;
  concat(schema: any): any;
  concat(schema: any): any {
    let next = super.concat(schema) as this;

    next.innerType = this.innerType;

    if (schema.innerType)
      next.innerType = next.innerType
        ? // @ts-expect-error Lazy doesn't have concat and will break
          next.innerType.concat(schema.innerType)
        : schema.innerType;

    return next;
  }

  of<U>(schema: ISchema<U, TContext>): ArraySchema<U, TContext, TFlags> {
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

  //  ArraySchema<T, TContext, T[], SetFlag<TFlags, 'd'>, NonNullable<TIn>>

  ensure() {
    return this.default<TIn>(() => [] as any).transform(
      (val: TIn, original: any) => {
        // We don't want to return `null` for nullable schema
        if (this._typeCheck(val)) return val;
        return original == null ? [] : [].concat(original);
      },
    );
  }

  compact(rejector?: RejectorFn) {
    let reject: RejectorFn = !rejector
      ? (v) => !!v
      : (v, i, a) => !rejector(v, i, a);

    return this.transform((values: any[]) =>
      values != null ? values.filter(reject) : values,
    );
  }

  describe(options?: ResolveOptions<TContext>) {
    let base = super.describe() as SchemaInnerTypeDescription;
    if (this.innerType) {
      let innerOptions = options;
      if (innerOptions?.value) {
        innerOptions = {
          ...innerOptions,
          parent: innerOptions.value,
          value: innerOptions.value[0],
        };
      }
      base.innerType = this.innerType.describe(options);
    }
    return base;
  }
}

create.prototype = ArraySchema.prototype;

export default interface ArraySchema<
  T,
  TContext,
  TDefault = undefined,
  TFlags extends Flags = '',
  TIn extends any[] | null | undefined = T[] | undefined,
> extends BaseSchema<TIn, TContext, TDefault, TFlags> {
  default<D extends Maybe<TIn>>(
    def: Thunk<D>,
  ): ArraySchema<T, TContext, D, ToggleDefault<TFlags, D>, TIn>;

  concat<IT, IC, IF extends Flags>(
    schema: ArraySchema<IT, IC, IF>,
  ): ArraySchema<NonNullable<T> | IT, TContext & IC, TDefault, TFlags | IF>;
  concat(schema: this): this;

  defined(
    msg?: Message,
  ): ArraySchema<T, TContext, TDefault, TFlags, Defined<TIn>>;
  optional(): ArraySchema<T, TContext, TDefault, TFlags, TIn | undefined>;

  required(
    msg?: Message,
  ): ArraySchema<T, TContext, TDefault, TFlags, NonNullable<TIn>>;
  notRequired(): ArraySchema<T, TContext, TDefault, TFlags, Maybe<TIn>>;

  nullable(
    isNullable?: true,
  ): ArraySchema<T, TContext, TDefault, TFlags, TIn | null>;
  nullable(
    isNullable: false,
  ): ArraySchema<T, TContext, TDefault, TFlags, NotNull<TIn>>;

  strip(): ArraySchema<T, TContext, TDefault, SetFlag<TFlags, 's'>>;
}
