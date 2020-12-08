/* eslint-disable no-unused-labels */
/* eslint-disable no-unused-expressions */

import {
  array,
  string,
  object,
  mixed,
  number,
  ref,
  lazy,
  SchemaOf,
} from '../src';
import type {
  AssertsShape,
  DefaultFromShape,
  TypeOfShape,
} from '../src/object';
import type { Config, ResolveFlags } from '../src/schema';
import { Preserve } from '../src/types';
// import { HasFlag } from '../src/util/types';

mixed().required().nullable();

string().required().nullable();

/** Type utils */
{
  const strRequired = string().required();

  // string().default('hi').cast();

  // $ExpectType string
  strRequired.cast(undefined);

  //
  const strNullableOptional = string().nullable().optional();

  // $ExpectType Maybe<string>
  strNullableOptional.cast('');

  // $ExpectType string
  strNullableOptional.required().validateSync('');

  //
  //
  const strNullable = string().nullable();

  // $ExpectType Maybe<string>
  strNullable.validateSync('');

  const strDefined = string().default('');

  // $ExpectType string
  const _strDefined = strDefined.getDefault();

  const strDefault = string().nullable().default('').nullable().trim();

  // $ExpectType string | null
  strDefault.cast('');

  // $ExpectType string | null
  strDefault.validateSync('');

  //
  //
  const strDefaultRequired = string().nullable().required().default('').trim();

  // $ExpectType string
  strDefaultRequired.cast('');

  // $ExpectType string
  strDefaultRequired.validateSync(null);
}

{
  const obj = object({
    string: string().defined(),
    number: number().default(1),
    ref: ref('string'),
    nest: object({
      other: string(),
    }),
    lazy: lazy(() => number().defined()),
  });

  // type F = StringSchema<string>;
  // type f = F extends TypedSchema ? F['__type'] : false;

  // const f = obj.cast({});
  // f!.number;
  // f!.string;
  // type ia = typeof obj['fields']['nest']['__type'];

  type _d1 = DefaultFromShape<typeof obj['fields']>;

  // $ExpectType number | undefined
  type _i1 = TypeOfShape<typeof obj['fields']>['number'];

  // $ExpectType string
  type _i2 = TypeOfShape<typeof obj['fields']>['string'];

  // $ExpectType unknown
  type _i3 = TypeOfShape<typeof obj['fields']>['ref'];

  // $ExpectType number
  type _i33 = TypeOfShape<typeof obj['fields']>['lazy'];

  // $ExpectType number
  type _i4 = AssertsShape<typeof obj['fields']>['number'];

  // $ExpectType string
  type _i5 = AssertsShape<typeof obj['fields']>['string'];

  // type __ = typeof obj['fields']['lazy']['__outputType'];

  // $ExpectType number
  type _i6 = AssertsShape<typeof obj['fields']>['lazy'];

  const cast1 = obj.cast({});

  // $ExpectType string | undefined
  cast1!.nest!.other;

  // $ExpectType string
  cast1!.string;

  // $ExpectType number
  cast1!.number;

  //
  // Object Defaults
  //
  const dflt1 = obj.getDefaultFromShape();

  // $ExpectType number
  dflt1.number;

  // $ExpectType undefined
  dflt1.ref;

  // $ExpectType undefined
  dflt1.lazy;

  // $ExpectType undefined
  dflt1.string;

  // $ExpectType undefined
  dflt1.nest.other;

  const merge = object({
    field: string().required(),
    other: string().default(''),
  }).shape({
    field: number(),
  });

  // $ExpectType number | undefined
  merge.cast({}).field;

  // $ExpectType string
  merge.cast({}).other;
}

ObjectPartial: {
  const schema = object({
    // age: number(),
    name: string().required(),
    address: object()
      .shape({
        line1: string().required(),
        zip: number().required(),
      })
      .default(undefined),
  }).nullable();

  const partial = schema.partial();

  // $ExpectType string | undefined
  partial.validateSync({ age: '1' })!.name;

  // $ExpectType StringSchema<string | undefined, Config<Record<string, any>, "">>
  partial.fields.name;

  // $ExpectType string
  partial.validateSync({})!.address!.line1;

  const deepPartial = schema.deepPartial();

  // $ExpectType string | undefined
  deepPartial.validateSync({ age: '1' })!.name;

  // $ExpectType string | undefined
  deepPartial.validateSync({})!.address!.line1;
}

ObjectPick: {
  const schema = object({
    age: number(),
    name: string().required(),
  })
    .nullable()
    .required();

  // $ExpectType number | undefined
  schema.pick(['age']).validateSync({ age: '1' }).age;
}

ObjectOmit: {
  const schema = object({
    age: number(),
    name: string().required(),
  })
    .nullable()
    .required();

  // $ExpectType string
  schema.omit(['age']).validateSync({ name: '1' }).name;

  // $ExpectType string | undefined
  schema.omit(['age']).partial().validateSync({ name: '1' }).name;
}

SchemaOf: {
  type Person = {
    firstName: string;
  };

  type PersonSchema = SchemaOf<Person>;

  const _t: PersonSchema = object({
    firstName: string().defined(),
  });
}

{
  // const str = string();
  // type f = Type<typeof str>;

  type _b = Preserve<Config<any, '' | 's'>['flags'], 'd'>;
  // type _a = HasFlag<Config<any, '' | 's'>['flags'], 'd'>;
  type _f = ResolveFlags<string | undefined, Config<any, ''>['flags']>;

  // $ExpectType (string | undefined)[] | undefined
  array(string()).cast(null);

  // $ExpectType string[] | undefined
  array(string().required()).validateSync(null);

  // $ExpectType string[]
  array(string().default('')).required().validateSync(null);

  // $ExpectType string[] | undefined
  array(string().default('')).validateSync(null);

  // $ExpectType string[] | null | undefined
  array(string().default('')).nullable().validateSync(null);

  // $ExpectType (string | null)[] | undefined
  array(string().nullable().default('')).validateSync(null);

  // $ExpectType any[]
  array()
    .default([] as number[])
    .getDefault();

  // $ExpectType (string | null)[] | null
  array(string().nullable().default(''))
    .nullable()
    .default(() => [] as string[])
    .validateSync(null);

  const numList = [1, 2];

  // $ExpectType (number | undefined)[]
  array(number()).default(numList).getDefault();

  const a1 = object({
    list: array(number().required()).required(),
    nested: array(
      object({
        name: string().default(''),
      }),
    ),
  })
    .required()
    .validateSync(undefined);

  // $ExpectType number[]
  a1.list;

  // $ExpectType string | undefined
  a1.nested?.[0].name;

  // $ExpectType string
  a1.nested![0].name;

  // $ExpectType (number | undefined)[]
  const _c1 = array(number())
    .concat(array(number()).required())
    .validateSync([]);
}

{
  // $ExpectType string | undefined
  lazy(() => string()).cast(3);

  // $ExpectType string | number | undefined
  lazy((v) => (typeof v === 'string' ? string() : number())).cast(3);
}

//
// CONCAT
//
{
  // $ExpectType string
  mixed<string>().concat(mixed<string>().required()).validateSync('');

  // $ExpectType string | number | undefined
  const _oo = mixed<number>()
    .required()
    .concat(mixed<string>())
    .validateSync('');

  const _o = object({
    str: string(),
  }).concat(
    object({
      name: string(),
    }),
  );

  // $ExpectType string
  string().nullable().default('hi').concat(string()).cast('');

  // $ExpectType number
  number().nullable().default(1).concat(number()).cast('');

  // $ExpectType string | null
  string().default('hi').concat(string().nullable()).cast('');

  // $ExpectType number | null
  number().default(0).concat(number().nullable()).cast('');
}

// Context: {
//   type Context = { isCool: boolean };

//   const schema = object({
//     str: string().when('$isCool', {
//       is: true,
//       then: string().required(),
//     }),
//   });
// }
