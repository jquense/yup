// type UNSET = { 1: '@@UNSET_DEFAULT' };

import Schema from '../Schema';
import { Maybe } from '../types';

export type Presence = 'required' | 'optional';
export type Nullability = 'nullable' | 'nonnullable';

type Pluck<T extends TypeDef, O extends TypeDef> = T extends O ? T : never;

type MaintainOptionality<T, U> = T extends undefined ? U | undefined : U;

type StrictNonNullable<T> = T extends null ? never : T;

export type TypeDef = Nullability | Presence;

export type SetNullability<
  Def extends TypeDef,
  TValue extends Nullability
> = TValue extends 'nullable'
  ? Exclude<Def, 'nonnullable'> | 'nullable'
  : Exclude<Def, 'nullable'> | 'nonnullable';

export type SetPresence<
  Def extends TypeDef,
  TValue extends Presence
> = TValue extends 'required'
  ? Exclude<Def, 'optional'> | 'required'
  : Exclude<Def, 'required'> | 'optional';

export type ResolveDefault<TType, TDefault extends Maybe<TType> = undefined> =
  | TType
  | TDefault;

export type ResolveInput<
  TType,
  Def extends TypeDef,
  TDefault extends Maybe<TType> = undefined
> = Def extends 'nullable'
  ? TType | null | TDefault
  : StrictNonNullable<TType | TDefault>;

export type ResolveOutput<
  TType,
  Def extends TypeDef,
  TDefault extends Maybe<TType> = undefined
> = Pluck<Def, 'required'> extends never
  ? ResolveInput<TType, Def, TDefault> //
  : NonNullable<ResolveInput<TType, Def>>;

export type TypedSchema = { __inputType: any; __outputType: any };

export type TypeOf<TSchema extends TypedSchema> = TSchema['__inputType'];

export type Asserts<TSchema extends TypedSchema> = TSchema['__outputType'];

// type ResolveNullable<
//   TType,
//   TSpec extends SchemaSpec
// > = TSpec['nullable'] extends true ? TType | null : TType;

// type ResolveDefault<TType, TSpec extends SchemaSpec> = TSpec extends SchemaSpec<
//   infer Default
// >
//   ? Default extends UNSET
//     ? TType
//     : Default extends undefined
//     ? TType & undefined
//     : Exclude<TType, undefined>
//   : never;

// // type TypeOfShape<Shape extends Record<string, MixedSchema>> = {
// //   [K in keyof Shape]: ReturnType<Shape[K]['cast']>;
// // };

// export type ResolveCast<TType, TSpec extends SchemaSpec> = ResolveDefault<
//   ResolveNullable<TType, TSpec>,
//   TSpec
// >;

// export type ResolveRequired<
//   TType,
//   TSpec extends SchemaSpec
// > = TSpec['required'] extends true ? NonNullable<TType> : TType;

// export type TypedSchema = { _tsType: any; _tsValidate: any };

// // type Keys<TShape extends Record<string, MixedSchema>> = { fields: TShape };

// // type CastChildren<T extends TypedSchema> = T extends Keys<infer TShape> ? { }

// export type TypeOf<T extends TypedSchema> = T extends { spec: infer TSpec }
//   ? TSpec extends SchemaSpec
//     ? ResolveCast<T['_tsType'], TSpec>
//     : never
//   : never;

// export type Asserts<T extends TypedSchema> = T extends { spec: infer TSpec }
//   ? TSpec extends SchemaSpec
//     ? ResolveRequired<ResolveCast<T['_tsValidate'], TSpec>, TSpec>
//     : never
//   : never;
