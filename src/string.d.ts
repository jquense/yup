import type { MixedLocale } from './locale';
import type { Maybe } from './types';
import type { Defined, StrictNonNullable } from './util/types';
import type BaseSchema from './Base';

interface DefinedStringSchema<TType extends Maybe<string>>
  extends BaseSchema<TType, Defined<TType>> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): IIF<
    D,
    DefinedStringSchema<TType | undefined>,
    DefinedStringSchema<Defined<TType>>
  >;

  defined(msg?: MixedLocale['defined']): this;
  required(msg?: MixedLocale['required']): RequiredStringSchema<TType>;
  notRequired(): StringSchema<TType>;
  nullable(isNullable?: true): RequiredStringSchema<TType | null>;
  nullable(isNullable: false): RequiredStringSchema<StrictNonNullable<TType>>;
}

interface RequiredStringSchema<TType extends Maybe<string>>
  extends BaseSchema<TType, NonNullable<TType>> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): IIF<
    D,
    RequiredStringSchema<TType | undefined>,
    RequiredStringSchema<Defined<TType>>
  >;

  defined(msg?: MixedLocale['defined']): DefinedStringSchema<TType>;
  required(msg?: MixedLocale['required']): RequiredStringSchema<TType>;
  notRequired(): StringSchema<TType>;
  nullable(isNullable?: true): RequiredStringSchema<TType | null>;
  nullable(isNullable: false): RequiredStringSchema<StrictNonNullable<TType>>;
}

type Thunk<T> = T | (() => T);

type IIF<T, Y, N> = T extends undefined ? Y : N;
export default interface StringSchema<TType extends Maybe<string>>
  extends BaseSchema<TType, TType> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): IIF<D, StringSchema<TType | undefined>, StringSchema<Defined<TType>>>;

  defined(msg?: MixedLocale['defined']): DefinedStringSchema<TType>;
  required(msg?: MixedLocale['required']): RequiredStringSchema<TType>;
  notRequired(): StringSchema<TType>;

  nullable(isNullable?: true): StringSchema<TType | null>;
  nullable(isNullable: false): StringSchema<StrictNonNullable<TType>>;
}

create().required().nullable().defined().validateSync('');
