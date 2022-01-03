import isAbsent from './util/isAbsent';
import isSchema from './util/isSchema';
import printValue from './util/printValue';
import { array as locale } from './locale';
import type {
  AnyObject,
  InternalOptions,
  Message,
  Maybe,
  Optionals,
} from './types';
import type Reference from './Reference';
import {
  Defined,
  Flags,
  NotNull,
  SetFlag,
  Thunk,
  ToggleDefault,
  ISchema,
  UnsetFlag,
  Concat,
} from './util/types';
import Schema, {
  RunTest,
  SchemaInnerTypeDescription,
  SchemaSpec,
} from './schema';
import { ResolveOptions } from './Condition';
import parseJson from 'parse-json';
import { ValidationError } from '.';

type InnerType<T> = T extends Array<infer I> ? I : never;

export type RejectorFn = (
  value: any,
  index: number,
  array: readonly any[],
) => boolean;

export function create<C = AnyObject, T = any>(type?: ISchema<T, C>) {
  return new ArraySchema<T[] | undefined, C>(type as any);
}

export default class ArraySchema<
  TIn extends any[] | null | undefined,
  TContext,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TIn, TContext, TDefault, TFlags> {
  readonly innerType?: ISchema<InnerType<TIn>, TContext>;

  constructor(type?: ISchema<InnerType<TIn>, TContext>) {
    super({
      type: 'array',
      check(v: any): v is NonNullable<TIn> {
        return Array.isArray(v);
      },
    });

    // `undefined` specifically means uninitialized, as opposed to "no subtype"
    this.innerType = type;
  }

  protected _cast(_value: any, _opts: InternalOptions<TContext>) {
    const value = super._cast(_value, _opts);

    // should ignore nulls here
    if (!this._typeCheck(value) || !this.innerType) {
      return value;
    }

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

    panic: (err: Error, value: unknown) => void,
    callback: (err: ValidationError[], value: unknown) => void,
  ) {
    // let sync = options.sync;
    // let path = options.path;
    let innerType = this.innerType;
    // let endEarly = options.abortEarly ?? this.spec.abortEarly;
    let recursive = options.recursive ?? this.spec.recursive;

    let originalValue =
      options.originalValue != null ? options.originalValue : _value;

    super._validate(_value, options, panic, (arrayErrors, value) => {
      if (!recursive || !innerType || !this._typeCheck(value)) {
        callback(arrayErrors, value);
        return;
      }

      originalValue = originalValue || value;

      // #950 Ensure that sparse array empty slots are validated
      let tests: RunTest[] = new Array(value.length);
      for (let idx = 0; idx < value.length; idx++) {
        let item = value[idx];
        let path = `${options.path || ''}[${idx}]`;

        tests[idx] = innerType!.asTest(item, {
          ...options,
          path,
          parent: value,
          // FIXME
          index: idx,
          originalValue: originalValue[idx],
        });
      }

      this.runTests(
        {
          value,
          tests,
        },
        panic,
        (innerTypeErrors) =>
          callback(innerTypeErrors.concat(arrayErrors), value),
      );
    });
  }

  clone(spec?: SchemaSpec<any>) {
    const next = super.clone(spec);
    // @ts-expect-error readonly
    next.innerType = this.innerType;
    return next;
  }

  /** Parse an input JSON string to an object */
  json() {
    return this.transform(parseJson);
  }

  concat<IIn extends Maybe<any[]>, IC, ID, IF extends Flags>(
    schema: ArraySchema<IIn, IC, ID, IF>,
  ): ArraySchema<
    Concat<TIn, IIn>,
    TContext & IC,
    Extract<IF, 'd'> extends never ? TDefault : ID,
    TFlags | IF
  >;
  concat(schema: this): this;
  concat(schema: any): any {
    let next = super.concat(schema) as this;

    // @ts-expect-error readonly
    next.innerType = this.innerType;

    if (schema.innerType)
      // @ts-expect-error readonly
      next.innerType = next.innerType
        ? // @ts-expect-error Lazy doesn't have concat and will break
          next.innerType.concat(schema.innerType)
        : schema.innerType;

    return next;
  }

  of<U>(
    schema: ISchema<U, TContext>,
  ): ArraySchema<U[] | Optionals<TIn>, TContext, TFlags> {
    // FIXME: this should return a new instance of array without the default to be
    let next = this.clone();

    if (!isSchema(schema))
      throw new TypeError(
        '`array.of()` sub-schema must be a valid yup schema not: ' +
          printValue(schema),
      );

    // @ts-expect-error readonly
    next.innerType = schema;

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

    return this.transform((values: readonly any[]) =>
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
  TIn extends any[] | null | undefined,
  TContext,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TIn, TContext, TDefault, TFlags> {
  default<D extends Maybe<TIn>>(
    def: Thunk<D>,
  ): ArraySchema<TIn, TContext, D, ToggleDefault<TFlags, D>>;

  defined(msg?: Message): ArraySchema<Defined<TIn>, TContext, TDefault, TFlags>;
  optional(): ArraySchema<TIn | undefined, TContext, TDefault, TFlags>;

  required(
    msg?: Message,
  ): ArraySchema<NonNullable<TIn>, TContext, TDefault, TFlags>;
  notRequired(): ArraySchema<Maybe<TIn>, TContext, TDefault, TFlags>;

  nullable(msg?: Message): ArraySchema<TIn | null, TContext, TDefault, TFlags>;
  nonNullable(): ArraySchema<NotNull<TIn>, TContext, TDefault, TFlags>;

  strip(
    enabled: false,
  ): ArraySchema<TIn, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): ArraySchema<TIn, TContext, TDefault, SetFlag<TFlags, 's'>>;
}
