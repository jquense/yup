/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-labels */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import {
  array,
  string,
  object,
  mixed,
  number,
  ref,
  lazy,
  date,
  BaseSchema,
  StringSchema,
} from '../../src';
import type {
  AssertsShape,
  DefaultFromShape,
  TypeOfShape,
} from '../../src/object';
import type { Config, ResolveFlags } from '../../src/schema';
import { AnyObject, Preserve } from '../../src/types';
import { _ } from '../../src/util/types';

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

  // $ExpectType string | null | undefined
  strNullableOptional.cast('');

  // $ExpectType string
  strNullableOptional.required().validateSync('');

  //
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
    string: string<'foo'>().defined(),
    number: number().default(1),
    removed: number().strip(),
    ref: ref('string'),
    nest: object({
      other: string(),
    }),
    lazy: lazy(() => number().defined()),
  });

  type _d1 = DefaultFromShape<typeof obj['fields']>;

  // $ExpectType number | undefined
  type _i1 = TypeOfShape<typeof obj['fields']>['number'];

  // $ExpectType "foo"
  type _i2 = TypeOfShape<typeof obj['fields']>['string'];

  // $ExpectType unknown
  type _i3 = TypeOfShape<typeof obj['fields']>['ref'];

  // $ExpectType number
  type _i33 = TypeOfShape<typeof obj['fields']>['lazy'];

  // $ExpectType number
  type _i4 = AssertsShape<typeof obj['fields']>['number'];

  // $ExpectType "foo"
  type _i5 = AssertsShape<typeof obj['fields']>['string'];

  type _i6 = _<AssertsShape<typeof obj['fields']>>;

  // $ExpectType number
  type _i7 = AssertsShape<typeof obj['fields']>['lazy'];

  const cast1 = obj.cast({});

  // $ExpectType string | undefined
  cast1!.nest!.other;

  // $ExpectType "foo"
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
    nested?: {
      name: string;
    };
    firstName: string;
    title: string | undefined;
    age?: number;
    colors: string[];
    createdAt: Date;
  };

  type PersonSchema = SchemaOf<Person>;
  const _b: BaseSchema<
    string,
    Config<AnyObject, ''>
  > = null as any as StringSchema<string, Config<AnyObject, ''>>;

  const _t: PersonSchema = object({
    firstName: string().defined(),
    title: string(),
    age: lazy(() => number()),
    colors: array(string().defined()),
    createdAt: date().defined(),
    nested: object({
      name: string().required(),
    }),
  });
}

SchemaOfDate: {
  type Employee = {
    hire_date: Date;
    name: string;
  };

  type EmployeeSchema = SchemaOf<Employee>;

  const _t: EmployeeSchema = object({
    name: string().defined(),
    hire_date: date().defined(),
  });
}

SchemaOfDateArray: {
  type EmployeeWithPromotions = {
    promotion_dates: Date[];
    name: string;
  };

  type EmployeeWithPromotionsSchema = SchemaOf<EmployeeWithPromotions>;

  const _t: EmployeeWithPromotionsSchema = object({
    name: string().defined(),
    promotion_dates: array().of(date().defined()),
  });
}

SchemaOfFile: {
  type Document = {
    file: File;
    date_uploaded: Date;
    notes: string;
  };

  type FileSchema = SchemaOf<Document, File>;

  const _t: FileSchema = object({
    file: mixed<File>().defined(),
    date_uploaded: date().defined(),
    notes: string().defined(),
  });
}

SchemaOfFileArray: {
  type DocumentWithFullHistory = {
    history: File[];
    name: string;
  };

  type DocumentWithFullHistorySchema = SchemaOf<DocumentWithFullHistory, File>;

  const _t: DocumentWithFullHistorySchema = object({
    name: string().defined(),
    history: array().of(mixed<File>().defined()),
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

  // $ExpectType string[] | undefined
  array(lazy(() => string().default(''))).validateSync(null);

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
  // const _c1 = array(number())
  //   .concat(array(number()).required())
  //   .validateSync([]);

  // // $ExpectType { [x: string]: any; a: number; }[] | null
  // const _definedArray: Array<{ a: number }> | null = array()
  //   .of(object({ a: number().required() }))
  //   .nullable()
  //   .defined()
  //   .validateSync([]);

  // // $ExpectType { [x: string]: any; a: number; }[]
  // const _requiredArray: Array<{ a: number }> = array()
  //   .of(object({ a: number().required() }))
  //   .nullable()
  //   .required()
  //   .validateSync([]);
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
