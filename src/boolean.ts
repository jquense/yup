import MixedSchema from './mixed';
import { Maybe } from './types';
import { Nullability, Presence } from './util/types';

export function create() {
  return new BooleanSchema();
}

export default class BooleanSchema<
  TType extends boolean,
  TDefault extends Maybe<TType>,
  TNullablity extends Nullability,
  TPresence extends Presence
> extends MixedSchema<TType, TDefault, TNullablity, TPresence> {
  constructor() {
    super({ type: 'boolean' });

    this.withMutation(() => {
      this.transform(function (value) {
        if (!this.isType(value)) {
          if (/^(true|1)$/i.test(value)) return true;
          if (/^(false|0)$/i.test(value)) return false;
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
  default(): TDefault;
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): BooleanSchema<TType, TNextDefault, TNullablity, TPresence>;

  defined(): BooleanSchema<TType, TDefault, TNullablity, 'defined'>;

  required(): BooleanSchema<TType, TDefault, TNullablity, 'required'>;
  notRequired(): BooleanSchema<TType, TDefault, TNullablity, 'optional'>;

  nullable(
    isNullable?: true,
  ): BooleanSchema<TType, TDefault, 'nullable', TPresence>;
  nullable(
    isNullable: false,
  ): BooleanSchema<TType, TDefault, 'nonnullable', TPresence>;
}
