// import { Asserts } from '../src/mixed';
import { string, object, mixed, number } from '../src';
import { TypeOfShape } from '../src/object';
import {
  Asserts,
  ResolveInput,
  ResolveOutput,
  TypeOf,
} from '../src/util/types';

// let schema = object({
//   str: string().nullable(),
// }).shape({
//   num: number(),
// });

// const fff = mixed().nullable();

mixed().required().nullable();

string().required().nullable();

/** Type utils */
{
  // $ExpectType string | null
  type _i1 = ResolveInput<string, 'nullable' | 'optional', string>;

  // $ExpectType string | undefined
  type _i2 = ResolveInput<string, 'nonnullable' | 'required'>;

  // $ExpectType string
  type _i3 = ResolveInput<string, 'nonnullable', ''>;

  // $ExpectType string
  type _i4 = ResolveInput<string, 'nonnullable', null>;

  // $ExpectType string
  type _i5 = ResolveInput<string, 'nonnullable', null>;

  // $ExpectType string | null | undefined
  type _i6 = ResolveInput<string, 'nullable' | 'required'>;

  // $ExpectType string
  type _o1 = ResolveOutput<string, 'nullable' | 'required'>;

  // $ExpectType string | undefined
  type _o2 = ResolveOutput<string, 'nonnullable' | 'optional'>;

  // $ExpectType string
  type _o3 = ResolveOutput<string, 'nonnullable', ''>;

  // $ExpectType string
  type _o4 = ResolveOutput<string, 'nullable' | 'required', null>;

  // $ExpectType string
  type _o5 = ResolveOutput<string, 'nullable' | 'required', undefined>;

  // $ExpectType string | null | undefined
  type _o6 = ResolveOutput<string, 'nullable' | 'optional', undefined>;

  // $ExpectType string | null
  type _o7 = ResolveOutput<string, 'nullable' | 'optional', ''>;

  // $ExpectError number is not a MaybeString
  type _e1 = ResolveOutput<string, 'nullable' | 'optional', number>;
}
{
  const strNullableRequired = string().nullable().required();

  // $ExpectType string | null | undefined
  type _strNullableRequired1 = TypeOf<typeof strNullableRequired>;

  // $ExpectType string
  type _strNullableRequired2 = Asserts<typeof strNullableRequired>;

  const strNullable = string().nullable();

  // $ExpectType string | null | undefined
  type _strNullable = Asserts<typeof strNullable>;

  const strDefined = string().default('');

  // $ExpectType ""
  const _strDefined = strDefined.default();

  const strDefault = string().nullable().default('');

  // $ExpectType string | null
  type _strDefault1 = TypeOf<typeof strDefault>;

  // $ExpectType string | null
  type _strDefault2 = Asserts<typeof strDefault>;

  const strDefaultRequired = string().nullable().required().default('');

  // $ExpectType string | null
  type _strDefaultRequired1 = TypeOf<typeof strDefaultRequired>;

  // $ExpectType string
  type _strDefaultRequired2 = Asserts<typeof strDefaultRequired>;
}

{
  const obj = object({
    string: string().required(),
    number: number().default(1),
  });

  type ia = TypeOf<typeof obj>;
}
// const strPlain = string();

// type fff = typeof strPlain['spec']['hasDefault'];

// // $ExpectType string | undefined
// type _strPlain = Asserts<typeof strPlain>;

// const strRequired = string().required();
// // $ExpectType string
// type _strRequired = Asserts<typeof strRequired>;

// const strDefault = string().nullable().default(undefined);
// const strDefault2 = string().nullable().default('');

// // $ExpectType undefined
// strDefault.default();

// // $ExpectType string
// strDefault2.default();

// // $ExpectType string | null
// strDefault2.cast(undefined);

// // async function foo() {
// //   ff = await str.validate(undefined, {});
// //   ff = await str2.validate(null, {});
// // }

// let objWithDefault = object({
//   str: string().nullable().default(''),
//   num: number().default(3),
//   num2: number(),
// });
