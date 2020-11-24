import type { MixedLocale } from './locale';

import { Maybe } from './types';
import type { Defined, Presence, StrictNonNullable, Unset } from './util/types';
import BaseSchema from './Base';

export function create<TType = any>() {
  return new MixedSchema<TType>();
}

export default class MixedSchema<
  TType = any,
  TPresence extends Presence = Unset
> extends BaseSchema<TType, TType, TPresence> {}

export default interface MixedSchema<TType, TPresence extends Presence> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? MixedSchema<TType | undefined, TPresence>
    : MixedSchema<Defined<TType>, TPresence>;

  defined(msg?: MixedLocale['defined']): MixedSchema<TType, 'defined'>;
  required(msg?: MixedLocale['required']): MixedSchema<TType, 'required'>;
  notRequired(): MixedSchema<TType, 'optional'>;

  nullable(isNullable?: true): MixedSchema<TType | null, TPresence>;
  nullable(isNullable: false): MixedSchema<StrictNonNullable<TType>, TPresence>;
}
