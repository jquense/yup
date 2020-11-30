/* eslint-disable no-unused-labels */
/* eslint-disable no-unused-expressions */

import { array, string, object, mixed, number, ref, lazy } from '../src';
import type {
  AssertsShape,
  DefaultFromShape,
  ObjectSchemaOf,
  TypeOfShape,
} from '../src/object';
import { ResolveOutput, Unset } from '../src/util/types';

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
  // $ExpectType string
  type _d4 = ResolveOutput<string | null, 'required'>;

  // $ExpectType string
  type _d5 = ResolveOutput<string, 'required'>;

  // $ExpectType string
  type _o1 = ResolveOutput<string | null, 'required'>;

  // $ExpectType string | undefined
  type _o2 = ResolveOutput<string | undefined, 'optional'>;

  // $ExpectType string
  type _o22 = ResolveOutput<string | undefined, 'defined'>;

  // $ExpectType string
  type _o3 = ResolveOutput<string, Unset>;

  // $ExpectType string
  type _o4 = ResolveOutput<string | null, 'required'>;

  // $ExpectType string
  type _o5 = ResolveOutput<string | null, 'required'>;

  // $ExpectType string | null | undefined
  type _o6 = ResolveOutput<string | null | undefined, 'optional'>;

  // $ExpectType string | null
  type _o7 = ResolveOutput<string | null, 'optional'>;

  // $ExpectType string | null
  type _o8 = ResolveOutput<string | null, 'defined'>;

  // $ExpectType string
  type _o9 = ResolveOutput<string, 'defined'>;

  const strRequired = string().required();

  // $ExpectType string | undefined
  strRequired.cast(undefined);

  //
  const strNullableRequired = string().nullable().required();
  // $ExpectType string | null | undefined
  strNullableRequired.cast('');

  // $ExpectType string
  strNullableRequired.validateSync('');

  //
  //
  const strNullable = string().nullable();

  // $ExpectType string | null | undefined
  strNullable.validateSync('');

  const strDefined = string().default('');

  // $ExpectType string
  const _strDefined = strDefined.getDefault();

  const strDefault = string().nullable().default('');

  // $ExpectType string | null
  strDefault.cast('');

  // $ExpectType string | null
  strDefault.validateSync('');

  //
  //
  const strDefaultRequired = string().nullable().required().default('');

  // $ExpectType string | null
  strDefaultRequired.cast('');

  // $ExpectType string
  strDefaultRequired.validateSync(null);
}

{
  const obj = object({
    string: string().required(),
    number: number().default(1),
    ref: ref('string'),
    nest: object({
      other: string(),
    }),
    lazy: lazy(() => number().required()),
  });

  // type F = StringSchema<string>;
  // type f = F extends TypedSchema ? F['__inputType'] : false;

  // const f = obj.cast({});
  // f!.number;
  // f!.string;
  // type ia = typeof obj['fields']['nest']['__inputType'];

  type _d1 = DefaultFromShape<typeof obj['fields']>;
  // $ExpectType number
  type _i1 = TypeOfShape<typeof obj['fields']>['number'];

  // $ExpectType string | undefined
  type _i2 = TypeOfShape<typeof obj['fields']>['string'];

  // $ExpectType unknown
  type _i3 = TypeOfShape<typeof obj['fields']>['ref'];

  // $ExpectType number | undefined
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

  // $ExpectType string | undefined
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

ObjectSchemaOf: {
  type Person = {
    firstName: string;
  };

  type PersonSchema = ObjectSchemaOf<Person>;

  const _t: PersonSchema = object({
    firstName: string().defined(),
  });
}

{
  // const str = string();
  // type f = Type<typeof str>;

  // $ExpectType (string | undefined)[] | undefined
  array(string()).cast(null);

  // $ExpectType string[] | undefined
  array(string().required()).validateSync(null);

  // $ExpectType string[]
  array(string().default('')).required().validateSync(null);

  // $ExpectType string[] | undefined
  array(string().default('')).validateSync(null);

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
  mixed<string>().required().concat(mixed<string>()).validateSync('');

  let _f = mixed<string>().notRequired();

  // $ExpectType string | undefined
  const _oo = mixed<string>().required().concat(_f).validateSync('');

  const _o = object({
    str: string(),
  }).concat(
    object({
      name: string(),
    }),
  );

  // $ExpectType MixedSchema<number | "hi", any, "unset", "unset", any, any>
  // string().oneOf(['hi' as const]);
}
