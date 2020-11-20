// type UNSET = { 1: '@@UNSET_DEFAULT' };

import Schema from '../Schema';
import { Maybe } from '../types';

export type Unset = 'unset';
export type Presence = 'required' | 'optional' | Unset;
export type Nullability = 'nullable' | 'nonnullable' | Unset;

type StrictNonNullable<T> = T extends null ? never : T;

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
  : ResolveInput<TType, TNull, TDefault>; //

export type TypedSchema = {
  __inputType: any;
  __outputType: any;
  // cast(...args: any[]): any;
  // validateSync(...args: any[]): any;
};

// declare class Schema {}

export type TypeOf<TSchema extends TypedSchema> = TSchema['__inputType'];

export type Asserts<TSchema extends TypedSchema> = TSchema['__outputType'];

// export type Concat<TSchema extends TypedSchema> = TSchema extends TypedSchema<infer TDef>
// ?
//   : never
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
