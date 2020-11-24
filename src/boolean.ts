import BaseSchema from './Base';
import type { MixedLocale } from './locale';
import MixedSchema from './mixed';
import type { Maybe } from './types';
import type { Defined, Nullability, Presence, Unset } from './util/types';

export function create() {
  return new BooleanSchema();
}

export default class BooleanSchema<
  TType extends Maybe<boolean> = boolean | undefined,
  TPresence extends Presence = Unset
> extends BaseSchema<TType, TType, TPresence> {
  constructor() {
    super({ type: 'boolean' });

    this.withMutation(() => {
      this.transform(function (value) {
        if (!this.isType(value)) {
          if (/^(true|1)$/i.test(String(value))) return true;
          if (/^(false|0)$/i.test(String(value))) return false;
        }
        return value;
      });
    });
  }

  protected _typeCheck(v: any): v is NonNullable<TType> {
    if (v instanceof Boolean) v = v.valueOf();

    return typeof v === 'boolean';
  }
}

export default interface BooleanSchema<
  TType extends Maybe<boolean>,
  TPresence extends Presence
> extends BaseSchema<TType, TType, TPresence> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? BooleanSchema<TType | undefined, TPresence>
    : BooleanSchema<Defined<TType>, TPresence>;

  defined(msg?: MixedLocale['defined']): BooleanSchema<TType, 'defined'>;
  required(msg?: MixedLocale['required']): BooleanSchema<TType, 'required'>;
  notRequired(): BooleanSchema<TType, 'optional'>;
  // optional(): BooleanSchema<TType, 'optional'>;

  nullable(isNullable?: true): BooleanSchema<TType, TPresence>;
  nullable(isNullable: false): BooleanSchema<TType, TPresence>;
}
