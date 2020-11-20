import type { MixedLocale } from './locale';
import MixedSchema from './mixed';
import type { Maybe } from './types';
import type { Nullability, Presence, Unset } from './util/types';

export function create() {
  return new BooleanSchema();
}

export default class BooleanSchema<
  TType extends boolean,
  TDefault extends Maybe<TType> = undefined,
  TNullablity extends Nullability = Unset,
  TPresence extends Presence = Unset
> extends MixedSchema<TType, TDefault, TNullablity, TPresence> {
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

  protected _typeCheck(v: any): v is TType {
    if (v instanceof Boolean) v = v.valueOf();

    return typeof v === 'boolean';
  }
}

export default interface BooleanSchema<
  TType extends boolean,
  TDefault extends Maybe<TType>,
  TNullablity extends Nullability,
  TPresence extends Presence
> extends MixedSchema<TType, TDefault, TNullablity, TPresence> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): BooleanSchema<TType, TNextDefault, TNullablity, TPresence>;

  defined(
    msg?: MixedLocale['defined'],
  ): BooleanSchema<TType, TDefault, TNullablity, 'defined'>;

  required(
    msg?: MixedLocale['required'],
  ): BooleanSchema<TType, TDefault, TNullablity, 'required'>;
  notRequired(): BooleanSchema<TType, TDefault, TNullablity, 'optional'>;

  nullable(
    isNullable?: true,
  ): BooleanSchema<TType, TDefault, 'nullable', TPresence>;
  nullable(
    isNullable: false,
  ): BooleanSchema<TType, TDefault, 'nonnullable', TPresence>;
}
