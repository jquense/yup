import { number as locale } from './locale';
import isAbsent from './util/isAbsent';
import type { AnyObject, DefaultThunk, Message } from './types';
import type Reference from './Reference';
import type {
  Concat,
  Defined,
  Flags,
  NotNull,
  SetFlag,
  Maybe,
  ToggleDefault,
  UnsetFlag,
} from './util/types';
import Schema from './schema';

let isNaN = (value: Maybe<number>) => value != +value!;

export function create(): NumberSchema;
export function create<
  T extends number,
  TContext extends Maybe<AnyObject> = AnyObject,
>(): NumberSchema<T | undefined, TContext>;
export function create() {
  return new NumberSchema();
}

export default class NumberSchema<
  TType extends Maybe<number> = number | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  constructor() {
    super({
      type: 'number',
      check(value: any): value is NonNullable<TType> {
        if (value instanceof Number) value = value.valueOf();

        return typeof value === 'number' && !isNaN(value);
      },
    });

    this.withMutation(() => {
      this.transform((value, _raw, ctx) => {
        if (!ctx.spec.coerce) return value;

        let parsed = value;
        if (typeof parsed === 'string') {
          parsed = parsed.replace(/\s/g, '');
          if (parsed === '') return NaN;
          // don't use parseFloat to avoid positives on alpha-numeric strings
          parsed = +parsed;
        }

        // null -> NaN isn't useful; treat all nulls as null and let it fail on
        // nullability check vs TypeErrors
        if (ctx.isType(parsed) || parsed === null) return parsed;

        return parseFloat(parsed);
      });
    });
  }

  min(min: number | Reference<number>, message = locale.min) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      skipAbsent: true,
      test(value: Maybe<number>) {
        return value! >= this.resolve(min);
      },
    });
  }

  max(max: number | Reference<number>, message = locale.max) {
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      skipAbsent: true,
      test(value: Maybe<number>) {
        return value! <= this.resolve(max);
      },
    });
  }

  lessThan(less: number | Reference<number>, message = locale.lessThan) {
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { less },
      skipAbsent: true,
      test(value: Maybe<number>) {
        return value! < this.resolve(less);
      },
    });
  }

  moreThan(more: number | Reference<number>, message = locale.moreThan) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { more },
      skipAbsent: true,
      test(value: Maybe<number>) {
        return value! > this.resolve(more);
      },
    });
  }

  positive(msg = locale.positive) {
    return this.moreThan(0, msg);
  }

  negative(msg = locale.negative) {
    return this.lessThan(0, msg);
  }

  integer(message = locale.integer) {
    return this.test({
      name: 'integer',
      message,
      skipAbsent: true,
      test: (val) => Number.isInteger(val),
    });
  }

  truncate() {
    return this.transform((value) => (!isAbsent(value) ? value | 0 : value));
  }

  round(method?: 'ceil' | 'floor' | 'round' | 'trunc') {
    let avail = ['ceil', 'floor', 'round', 'trunc'];
    method = (method?.toLowerCase() as any) || ('round' as const);

    // this exists for symemtry with the new Math.trunc
    if (method === 'trunc') return this.truncate();

    if (avail.indexOf(method!.toLowerCase()) === -1)
      throw new TypeError(
        'Only valid options for round() are: ' + avail.join(', '),
      );

    return this.transform((value) =>
      !isAbsent(value) ? Math[method!](value) : value,
    );
  }
}

create.prototype = NumberSchema.prototype;

//
// Number Interfaces
//

export default interface NumberSchema<
  TType extends Maybe<number> = number | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  default<D extends Maybe<TType>>(
    def: DefaultThunk<D, TContext>,
  ): NumberSchema<TType, TContext, D, ToggleDefault<TFlags, D>>;

  concat<UType extends Maybe<number>, UContext, UFlags extends Flags, UDefault>(
    schema: NumberSchema<UType, UContext, UDefault, UFlags>,
  ): NumberSchema<
    Concat<TType, UType>,
    TContext & UContext,
    UDefault,
    TFlags | UFlags
  >;
  concat(schema: this): this;

  defined(
    msg?: Message,
  ): NumberSchema<Defined<TType>, TContext, TDefault, TFlags>;
  optional(): NumberSchema<TType | undefined, TContext, TDefault, TFlags>;

  required(
    msg?: Message,
  ): NumberSchema<NonNullable<TType>, TContext, TDefault, TFlags>;
  notRequired(): NumberSchema<Maybe<TType>, TContext, TDefault, TFlags>;

  nullable(
    msg?: Message,
  ): NumberSchema<TType | null, TContext, TDefault, TFlags>;
  nonNullable(
    msg?: Message,
  ): NumberSchema<NotNull<TType>, TContext, TDefault, TFlags>;

  strip(
    enabled: false,
  ): NumberSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): NumberSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
}
