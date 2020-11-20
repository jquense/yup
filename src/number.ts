import MixedSchema from './mixed';
import { MixedLocale, number as locale } from './locale';
import isAbsent from './util/isAbsent';
import type { Maybe } from './types';
import type Reference from './Reference';
import type { Nullability, Presence, Unset } from './util/types';

let isNaN = (value: Maybe<number>) => value != +value!;

export function create() {
  return new NumberSchema();
}

export default class NumberSchema<
  TType extends number,
  TDefault extends Maybe<TType> = undefined,
  TNullablity extends Nullability = Unset,
  TPresence extends Presence = Unset
> extends MixedSchema<TType, TDefault, TNullablity, TPresence> {
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

  protected _typeCheck(value: any): value is TType {
    if (value instanceof Number) value = value.valueOf();

    return typeof value === 'number' && !isNaN(value);
  }

  min(min: number | Reference, message = locale.min) {
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

  max(max: number | Reference, message = locale.max) {
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

  lessThan(less: number | Reference, message = locale.lessThan) {
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

  moreThan(more: number | Reference, message = locale.moreThan) {
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

export default interface NumberSchema<
  TType extends number,
  TDefault extends Maybe<TType>,
  TNullablity extends Nullability,
  TPresence extends Presence
> extends MixedSchema<TType, TDefault, TNullablity, TPresence> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): NumberSchema<TType, TNextDefault, TNullablity, TPresence>;

  defined(
    msg?: MixedLocale['defined'],
  ): NumberSchema<TType, TDefault, TNullablity, 'defined'>;

  required(
    msg?: MixedLocale['required'],
  ): NumberSchema<TType, TDefault, TNullablity, 'required'>;
  notRequired(): NumberSchema<TType, TDefault, TNullablity, 'optional'>;

  nullable(
    isNullable?: true,
  ): NumberSchema<TType, TDefault, 'nullable', TPresence>;
  nullable(
    isNullable: false,
  ): NumberSchema<TType, TDefault, 'nonnullable', TPresence>;
}
