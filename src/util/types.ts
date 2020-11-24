import { Maybe } from '../types';

export type Unset = 'unset';
export type Presence = 'required' | 'defined' | 'optional' | Unset;
export type Nullability = 'nullable' | 'nonnullable' | Unset;

export type InferPresence<T> = T extends null
  ? 'unset'
  : T extends undefined
  ? 'defined'
  : 'required';

export type StrictNonNullable<T> = T extends null ? never : T;

export type Defined<T> = T extends undefined ? never : T;

export type TypeDef = Nullability | Presence | '';

export type Default<T, D> = D extends undefined ? T | undefined : T;

export type ResolveDefault<TType, TDefault extends Maybe<TType> = undefined> =
  | TType
  | TDefault;

export type ResolveInput<
  TType,
  TNull = Unset,
  TDefault = undefined
> = TNull extends 'nullable'
  ? Default<TType, TDefault> | null
  : StrictNonNullable<TType>;

export type ResolveOutput<TType, TPresent = Unset> = TPresent extends 'required'
  ? NonNullable<TType>
  : TPresent extends 'defined'
  ? Defined<TType>
  : TType; //

export type TypedSchema = {
  __inputType: any;
  __outputType: any;
};

export type TypeOf<TSchema extends TypedSchema> = TSchema['__inputType'];

export type Asserts<TSchema extends TypedSchema> = TSchema['__outputType'];
