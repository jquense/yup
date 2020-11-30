import { MixedLocale, number as locale } from './locale';
import isAbsent from './util/isAbsent';
import type { AnyObject, Maybe } from './types';
import type Reference from './Reference';
import type { Defined, If, Thunk } from './util/types';
import BaseSchema from './Base';

let isNaN = (value: Maybe<number>) => value != +value!;

export function create() {
  return new NumberSchema();
}

export default class NumberSchema<
  TType extends Maybe<number> = number | undefined,
  TContext extends AnyObject = AnyObject,
  TOut extends TType = TType
> extends BaseSchema<TType, TContext, TOut> {
  constructor() {
    super({ type: 'number' });

    this.withMutation(() => {
      this.transform(function (value) {
        let parsed = value;

        if (typeof parsed === 'string') {
          parsed = parsed.replace(/\s/g, '');
          if (parsed === '') return NaN;
          // don't use parseFloat to avoid positives on alpha-numeric strings
          parsed = +parsed;
        }

        if (this.isType(parsed)) return parsed;

        return parseFloat(parsed);
      });
    });
  }

  protected _typeCheck(value: any): value is NonNullable<TType> {
    if (value instanceof Number) value = value.valueOf();

    return typeof value === 'number' && !isNaN(value);
  }

  min(min: number | Reference<number>, message = locale.min) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value: Maybe<number>) {
        return isAbsent(value) || value >= this.resolve(min);
      },
    });
  }

  max(max: number | Reference<number>, message = locale.max) {
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value: Maybe<number>) {
        return isAbsent(value) || value <= this.resolve(max);
      },
    });
  }

  lessThan(less: number | Reference<number>, message = locale.lessThan) {
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { less },
      test(value: Maybe<number>) {
        return isAbsent(value) || value < this.resolve(less);
      },
    });
  }

  moreThan(more: number | Reference<number>, message = locale.moreThan) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { more },
      test(value: Maybe<number>) {
        return isAbsent(value) || value > this.resolve(more);
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
      test: (val) => isAbsent(val) || Number.isInteger(val),
    });
  }

  truncate() {
    return this.transform((value) => (!isAbsent(value) ? value | 0 : value));
  }

  round(method: 'ceil' | 'floor' | 'round' | 'trunc') {
    var avail = ['ceil', 'floor', 'round', 'trunc'];
    method = (method?.toLowerCase() as any) || ('round' as const);

    // this exists for symemtry with the new Math.trunc
    if (method === 'trunc') return this.truncate();

    if (avail.indexOf(method.toLowerCase()) === -1)
      throw new TypeError(
        'Only valid options for round() are: ' + avail.join(', '),
      );

    return this.transform((value) =>
      !isAbsent(value) ? Math[method](value) : value,
    );
  }
}

//
// Number Interfaces
//

export default interface NumberSchema<
  TType extends Maybe<number> = number | undefined,
  TContext extends AnyObject = AnyObject,
  TOut extends TType = TType
> extends BaseSchema<TType, TContext, TOut> {
  concat<TOther extends NumberSchema<any, any, any>>(schema: TOther): TOther;

  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): If<
    D,
    NumberSchema<TType | undefined, TContext>,
    NumberSchema<Defined<TType>, TContext>
  >;

  defined(msg?: MixedLocale['defined']): DefinedNumberSchema<TType, TContext>;

  required(
    msg?: MixedLocale['required'],
  ): RequiredNumberSchema<TType, TContext>;
  optional(): NumberSchema<TType, TContext>;
  notRequired(): NumberSchema<TType, TContext>;

  nullable(isNullable?: true): NumberSchema<TType | null, TContext>;
  nullable(isNullable: false): NumberSchema<Exclude<TType, null>, TContext>;
}

export interface DefinedNumberSchema<
  TType extends Maybe<number>,
  TContext extends AnyObject = AnyObject
> extends NumberSchema<TType, TContext, Defined<TType>> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): If<
    D,
    DefinedNumberSchema<TType | undefined, TContext>,
    DefinedNumberSchema<Defined<TType>, TContext>
  >;

  defined(msg?: MixedLocale['defined']): this;
  required(
    msg?: MixedLocale['required'],
  ): RequiredNumberSchema<TType, TContext>;
  optional(): NumberSchema<TType, TContext>;
  notRequired(): NumberSchema<TType, TContext>;
  nullable(isNullable?: true): RequiredNumberSchema<TType | null, TContext>;
  nullable(
    isNullable: false,
  ): RequiredNumberSchema<Exclude<TType, null>, TContext>;
}

export interface RequiredNumberSchema<
  TType extends Maybe<number>,
  TContext extends AnyObject = AnyObject
> extends NumberSchema<TType, TContext, NonNullable<TType>> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): If<
    D,
    RequiredNumberSchema<TType | undefined, TContext>,
    RequiredNumberSchema<Defined<TType>, TContext>
  >;

  defined(msg?: MixedLocale['defined']): DefinedNumberSchema<TType, TContext>;
  required(
    msg?: MixedLocale['required'],
  ): RequiredNumberSchema<TType, TContext>;
  optional(): NumberSchema<TType, TContext>;
  notRequired(): NumberSchema<TType, TContext>;
  nullable(isNullable?: true): RequiredNumberSchema<TType | null, TContext>;
  nullable(
    isNullable: false,
  ): RequiredNumberSchema<Exclude<TType, null>, TContext>;
}
