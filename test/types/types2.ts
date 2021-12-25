/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-labels */
import { AnySchema, array, number, string, date, ref } from '../../src';
import { create as lazy } from '../../src/Lazy';
import ObjectSchema, { create as object } from '../../src/object';

import { ISchema, _ } from '../../src/util/types';

Strings: {
  const strRequired = string().required();

  // $ExpectType string
  strRequired.cast(undefined);

  //
  const strNullableOptional = string().nullable().optional();

  // $ExpectType string | null | undefined
  strNullableOptional.cast('');

  // $ExpectType string
  strNullableOptional.required().validateSync('');

  //
  const strNullable = string().nullable();

  // $ExpectType string | null | undefined
  strNullable.validateSync('');

  const strDefined = string().default('');

  // $ExpectType string
  const _strDefined = strDefined.getDefault();

  const strDefault = string().nullable().default('').nullable().trim();

  // $ExpectType string | null
  strDefault.cast('');

  // $ExpectType string | null
  strDefault.validateSync('');

  // $ExpectType StringSchema<string, AnyObject, "d">
  const strDefaultRequired = string().nullable().required().default('').trim();

  // $ExpectType string
  strDefaultRequired.cast('');

  // $ExpectType string
  strDefaultRequired.validateSync(null);

  // $ExpectType "foo" | "bar"
  string<'foo' | 'bar'>().defined().validateSync('foo');
}

Numbers: {
  const numRequired = number().required();

  // $ExpectType number
  numRequired.cast(undefined);

  //
  const numNullableOptional = number().nullable().optional();

  // $ExpectType number | null | undefined
  numNullableOptional.cast('');

  // $ExpectType number
  numNullableOptional.required().validateSync('');

  //
  //
  const numNullable = number().nullable();

  // $ExpectType number | null | undefined
  numNullable.validateSync('');

  const numDefined = number().default(3);

  // $ExpectType number
  numDefined.getDefault();

  const numDefault = number().nullable().default(3).nullable().min(2);

  // $ExpectType number | null
  numDefault.cast('');

  // $ExpectType number | null
  numDefault.validateSync('');

  //
  const numDefaultRequired = number().nullable().required().default(3);

  // $ExpectType number
  numDefaultRequired.cast('');

  // $ExpectType number
  numDefaultRequired.validateSync(null);
}

{
  const dtRequired = date().required();

  // $ExpectType Date
  dtRequired.cast(undefined);

  //
  const dtNullableOptional = date().nullable().optional();

  // $ExpectType Date | null | undefined
  dtNullableOptional.cast('');

  // $ExpectType Date
  dtNullableOptional.required().validateSync('');

  //
  //
  const dtNullable = date().nullable();

  // $ExpectType Date | null | undefined
  dtNullable.validateSync('');

  const dtDefined = date().default(() => new Date());

  // $ExpectType Date
  const _dtDefined = dtDefined.getDefault();

  const dtDefault = date()
    .nullable()
    .default(() => new Date())
    .nullable()
    .min(new Date());

  // $ExpectType Date | null
  dtDefault.cast('');

  // $ExpectType Date | null
  dtDefault.validateSync('');

  //
  const dtDefaultRequired = date()
    .nullable()
    .required()
    .default(() => new Date());

  // $ExpectType Date
  dtDefaultRequired.cast('');

  // $ExpectType Date
  dtDefaultRequired.validateSync(null);
}

Lazy: {
  const l = lazy(() => string().default('asfasf'));

  l.cast(null);
}

Array: {
  let _t = array().cast([]);

  array(number()).cast([1]);

  type _a = AnySchema<number | undefined, any, ''>;

  type _b = _a['__outputType'];

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

  // $ExpectType string[] | undefined
  array(lazy(() => string().default(''))).validateSync(null);

  const numList = [1, 2];

  // $ExpectType (number | undefined)[]
  array(number()).default(numList).getDefault();

  // $ExpectType (number | undefined)[]
  array(number()).concat(array(number()).required()).validateSync([]);
}

Object: {
  type InferType<TSchema extends ISchema<any, any>> = TSchema['__outputType'];

  const v = object({
    name: string().defined(),
    colors: array(string().defined()).required(),
  }).optional();

  // $ExpectType { name: string, colors: string[] }
  v.cast({});

  type _I = InferType<typeof v>;

  interface Person {
    name: string;
  }

  const _person: ObjectSchema<Person> = object({ name: string().defined() });

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

  const obj = object({
    string: string<'foo'>().defined(),
    number: number().default(1),
    removed: number().strip(),
    ref: ref('string'),
    nest: object({
      other: string(),
    }),
    lazy: lazy(() => number().defined()),
  });

  const cast1 = obj.cast({});

  type f = _<ReturnType<typeof obj.getDefaultFromShape()>>;

  // $ExpectType string | undefined
  cast1!.nest!.other;

  // $ExpectType "foo"
  cast1!.string;

  // $ExpectType number
  cast1!.number;

  //
  // Object Defaults
  //
  // const dflt1 = obj.getDefaultFromShape();

  // // $ExpectType number
  // dflt1.number;

  // // $ExpectType undefined
  // dflt1.ref;

  // // $ExpectType undefined
  // dflt1.lazy;

  // // $ExpectType undefined
  // dflt1.string;

  // // $ExpectType undefined
  // dflt1.nest.other;

  const merge = object({
    field: string().required(),
    other: string().default(''),
  }).shape({
    field: number(),
    name: string(),
  });

  // $ExpectType number | undefined
  merge.cast({}).field;

  // $ExpectType string
  merge.cast({}).other;

  SchemaOfDate: {
    type Employee = {
      hire_date: Date;
      name: string;
    };

    const _t: ObjectSchema<Employee> = object({
      name: string().defined(),
      hire_date: date().defined(),
    });
  }

  SchemaOfDateArray: {
    type EmployeeWithPromotions = {
      promotion_dates: Date[];
      name: string;
    };

    const _t = object({
      name: string().defined(),
      promotion_dates: array().of(date().defined()).defined(),
    });
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

  ObjectPartial: {
    const schema = object({
      // age: number(),
      name: string().required(),
      address: object()
        .shape({
          line1: string().required(),
          zip: number().required().strip(),
        })
        .default(undefined),
    }).nullable();

    const partial = schema.partial();

    // $ExpectType string | undefined
    partial.validateSync({ age: '1' })!.name;

    // $ExpectType StringSchema<string | undefined, Config<AnyObject, "">>
    partial.fields.name;

    // $ExpectType string
    partial.validateSync({})!.address!.line1;

    const deepPartial = schema.deepPartial();

    // $ExpectType string | undefined
    deepPartial.validateSync({ age: '1' })!.name;

    // $ExpectType string | undefined
    deepPartial.validateSync({})!.address!.line1;
  }
}
