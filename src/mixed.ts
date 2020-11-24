import type { MixedLocale } from './locale';

import { Maybe } from './types';
import type { Defined, Presence, StrictNonNullable, Unset } from './util/types';
import BaseSchema from './Base';

export function create<TType = any>() {
  return new MixedSchema<TType>();
}

export default class MixedSchema<TType = any, TOut = TType> extends BaseSchema<
  TType,
  TType
> {}

export default interface MixedSchema<TType, TOut> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? MixedSchema<TType | undefined, TOut | undefined>
    : MixedSchema<Defined<TType>, Defined<TOut>>;

  defined(msg?: MixedLocale['defined']): MixedSchema<TType, Defined<TOut>>;
  required(
    msg?: MixedLocale['required'],
  ): MixedSchema<TType, NonNullable<TOut>>;
  notRequired(): MixedSchema<TType>;

  nullable(isNullable?: true): MixedSchema<TType | null>;
  nullable(isNullable: false): MixedSchema<StrictNonNullable<TType>>;
}
