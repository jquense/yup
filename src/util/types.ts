import { Maybe } from '../types';

export type Unset = 'unset';
export type Presence = 'required' | 'defined' | 'optional' | Unset;
export type Nullability = 'nullable' | 'nonnullable' | Unset;

type StrictNonNullable<T> = T extends null ? never : T;

type Defined<T> = T extends undefined ? never : T;

export type TypeDef = Nullability | Presence | '';

export type ResolveDefault<TType, TDefault extends Maybe<TType> = undefined> =
  | TType
  | TDefault;

export type ResolveInput<
  TType,
  TNull = Unset,
  TDefault = undefined
> = TNull extends 'nullable'
  ? TType | TDefault | null
  : StrictNonNullable<TType | TDefault>;

export type ResolveOutput<
  TType,
  TNull = Unset,
  TPresent = Unset,
  TDefault = undefined
> = TPresent extends 'required'
  ? NonNullable<ResolveInput<TType, TNull>>
  : TPresent extends 'defined'
  ? Defined<ResolveInput<TType, TNull>>
  : ResolveInput<TType, TNull, TDefault>; //

export type TypedSchema = {
  __inputType: any;
  __outputType: any;
};

export type TypeOf<TSchema extends TypedSchema> = TSchema['__inputType'];

export type Asserts<TSchema extends TypedSchema> = TSchema['__outputType'];
