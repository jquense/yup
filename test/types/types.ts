/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-labels */
import {
  array,
  number,
  string,
  date,
  ref,
  mixed,
  bool,
  reach,
  addMethod,
  Schema,
} from '../../src';
import { create as tuple } from '../../src/tuple';
import { create as lazy } from '../../src/Lazy';
import ObjectSchema, { create as object } from '../../src/object';

import { ResolveFlags, SetFlag, UnsetFlag, _ } from '../../src/util/types';

ResolveFlags: {
  // $ExpectType string | undefined
  type _a = ResolveFlags<string | undefined, 'd'>;

  // $ExpectType string | undefined
  type _b = ResolveFlags<string | undefined, 's'>;

  // $ExpectType string
  type _c = ResolveFlags<string | undefined, 's' | 'd', string>;

  // $ExpectType string | undefined
  type _d = ResolveFlags<string | undefined, 's' | '', string>;

  // $ExpectType string
  type _e = ResolveFlags<string | undefined, SetFlag<'s', 'd'>, string>;

  // $ExpectType ""
  type _f = UnsetFlag<'d', 'd'>;

  // $ExpectType "s"
  type _f2 = UnsetFlag<'d' | 's', 'd'>;

  // $ExpectType ""
  type _f3 = UnsetFlag<'', 'd'>;

  // $ExpectType "d"
  type _f4 = SetFlag<'', 'd'>;
}

Base_methods: {
  // $ExpectType boolean | undefined
  bool().oneOf([true, ref('$foo')]).__outputType;

  // $ExpectType "asf" | "foo" | undefined
  string().oneOf(['asf', ref<'foo'>('$foo')]).__outputType;

  // $ExpectType Date | undefined
  date().oneOf([new Date(), ref('$now')]).__outputType;

  // $ExpectType number | undefined
  number().oneOf([1, ref('$foo')]).__outputType;

  // type s = StringSchema<string | undefined, any, '', 's' | 'd'>;

  // type ss = s['__outputType'];
}

Mixed: {
  const mxRequired = mixed<string | number>().required();

  // $ExpectType NonNullable<string | number | undefined>
  mxRequired.cast(undefined);

  // $ExpectType NonNullable<string | number | undefined> | null
  mxRequired.nullable().cast(undefined);

  // $ExpectType NonNullable<string | number | undefined>
  mxRequired.nullable().nonNullable().cast(undefined);

  //
  const mxOptional = mixed<string>().optional();

  // $ExpectType string | undefined
  mxOptional.cast(undefined);

  // $ExpectType string
  mxOptional.defined().cast(undefined);

  //
  const mxNullableOptional = mixed<string>().nullable().optional();

  // $ExpectType string | null | undefined
  mxNullableOptional.cast('');

  // $ExpectType string
  mxNullableOptional.required().validateSync('');

  //
  const mxNullable = mixed<string>().nullable();

  // $ExpectType string | null | undefined
  mxNullable.validateSync('');

  const mxDefined = mixed<string>().default('');

  // $ExpectType ""
  mxDefined.getDefault();

  const mxDefault = mixed<string>().nullable().default('').nullable();

  // $ExpectType string | null
  mxDefault.cast('');

  // $ExpectType string | null
  mxDefault.validateSync('');

  // $ExpectType MixedSchema<string, AnyObject, "", "d">
  const mxDefaultRequired = mixed<string>().nullable().required().default('');

  // $ExpectType string
  mxDefaultRequired.cast('');

  // $ExpectType string
  mxDefaultRequired.validateSync(null);

  // $ExpectType "foo" | "bar"
  string<'foo' | 'bar'>().defined().validateSync('foo');

  // $ExpectType string | undefined
  mixed<string>().strip().cast(undefined);

  // $ExpectType string | undefined
  mixed<string>().strip().strip(false).cast(undefined);

  // $ExpectType string | undefined
  mixed<string>().optional().concat(mixed<string>()).cast('');

  // $ExpectType string
  mixed<string>().optional().concat(mixed<string>().defined()).cast('');

  // $ExpectType string | undefined
  mixed<string>().nullable().concat(mixed<string>()).cast('');

  // $ExpectType string | null | undefined
  mixed<string>()
    .nullable()
    .concat(mixed<string>().optional().nullable())
    .cast('');

  // $ExpectType "foo" | undefined
  mixed<string>().notRequired().concat(string<'foo'>()).cast('');

  // $ExpectType MixedSchema<string | undefined, AnyObject, undefined, "">
  mixed((value): value is string => typeof value === 'string');

  // $ExpectType MixedSchema<string | undefined, AnyObject, undefined, "">
  mixed({
    type: 'string',
    check: (value): value is string => typeof value === 'string',
  });

  // $ExpectType string
  mixed<string>().defined().cast('', { assert: true });

  // $ExpectType string | null | undefined
  mixed<string>().defined().cast('', { assert: 'ignore-optionality' });

  // $ExpectType AnyPresentValue | null
  mixed().defined().nullable().cast('');
}

Strings: {
  const strRequired = string().required();

  // $ExpectType string
  strRequired.cast(undefined);

  // $ExpectType string | null
  strRequired.nullable().cast(undefined);

  // $ExpectType string
  strRequired.nullable().nonNullable().cast(undefined);

  //
  const strOptional = string().optional();

  // $ExpectType string | undefined
  strOptional.cast(undefined);

  // $ExpectType string
  strOptional.defined().cast(undefined);

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

  // $ExpectType ""
  strDefined.getDefault();

  const strDefault = string().nullable().default('').nullable().trim();

  // $ExpectType string | null
  strDefault.cast('');

  // $ExpectType string | null
  strDefault.validateSync('');

  // $ExpectType StringSchema<string, AnyObject, "", "d">
  const strDefaultRequired = string().nullable().required().default('').trim();

  // $ExpectType string
  strDefaultRequired.cast('');

  // $ExpectType string
  strDefaultRequired.validateSync(null);

  // $ExpectType "foo" | "bar"
  string<'foo' | 'bar'>().defined().validateSync('foo');

  // $ExpectType string | undefined
  string().strip().cast(undefined);

  // $ExpectType string | undefined
  string().strip().strip(false).cast(undefined);

  // $ExpectType string | undefined
  string().optional().concat(string()).cast('');

  // $ExpectType string
  string().optional().concat(string().defined()).cast('');

  // $ExpectType string | undefined
  string().nullable().concat(string()).cast('');

  // $ExpectType string | null | undefined
  string().nullable().concat(string().optional().nullable()).cast('');

  // $ExpectType "foo" | undefined
  string().notRequired().concat(string<'foo'>()).cast('');

  // $ExpectType "foo" | null
  string<'foo'>()
    .notRequired()
    .concat(string().nullable().default('bar'))
    .cast('');

  // $ExpectType never
  string<'bar'>().concat(string<'foo'>().defined()).cast('');

  // $ExpectType never
  string<'bar'>().concat(string<'foo'>()).cast('');

  // $ExpectType "foo" | "bar" | undefined
  string().oneOf(['foo', 'bar']).__outputType;

  // $ExpectType "foo" | "bar" | null | undefined
  string().nullable().oneOf(['foo', 'bar']).__outputType;
}

Numbers: {
  const numRequired = number().required();

  // $ExpectType number
  numRequired.cast(undefined);

  // $ExpectType number | null
  numRequired.nullable().cast(undefined);

  // $ExpectType number
  numRequired.nullable().nonNullable().cast(undefined);

  //
  const numOptional = number().optional();

  // $ExpectType number | undefined
  numOptional.cast(undefined);

  // $ExpectType number
  numOptional.defined().cast(undefined);

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

  // $ExpectType 3
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

  // $ExpectType number | undefined
  number().strip().cast(undefined);

  // $ExpectType number | undefined
  number().strip().strip(false).cast(undefined);

  // $ExpectType 1 | undefined
  number().notRequired().concat(number<1>()).cast('');

  // $ExpectType 1 | null
  number<1>().notRequired().concat(number().nullable().default(2)).cast('');

  // $ExpectType never
  number<2>().concat(number<1>().defined()).cast('');

  // $ExpectType never
  number<2>().concat(number<1>()).cast('');
}

date: {
  const dtRequired = date().required();

  // $ExpectType Date
  dtRequired.cast(undefined);

  // $ExpectType Date | null
  dtRequired.nullable().cast(undefined);

  // $ExpectType Date
  dtRequired.nullable().nonNullable().cast(undefined);

  //
  const dtOptional = date().optional();

  // $ExpectType Date | undefined
  dtOptional.cast(undefined);

  // $ExpectType Date
  dtOptional.defined().cast(undefined);

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

  // $ExpectType Date | undefined
  date().strip().cast(undefined);

  // $ExpectType Date | undefined
  date().strip().strip(false).cast(undefined);
}

bool: {
  const blRequired = bool().required();

  // $ExpectType NonNullable<boolean | undefined>
  blRequired.cast(undefined);

  // $ExpectType NonNullable<boolean | undefined> | null
  blRequired.nullable().cast(undefined);

  // $ExpectType NonNullable<boolean | undefined>
  blRequired.nullable().nonNullable().cast(undefined);

  //
  const blOptional = bool().optional();

  // $ExpectType boolean | undefined
  blOptional.cast(undefined);

  // $ExpectType boolean
  blOptional.defined().cast(undefined);

  //
  const blNullableOptional = bool().nullable().optional();

  // $ExpectType boolean | null | undefined
  blNullableOptional.cast('');

  // $ExpectType NonNullable<boolean | null | undefined>
  blNullableOptional.required().validateSync('');

  //
  //
  const blNullable = bool().nullable();

  // $ExpectType boolean | null | undefined
  blNullable.validateSync('');

  const blDefined = bool().default(false);

  // $ExpectType false
  blDefined.getDefault();

  // $ExpectType false | undefined
  bool().isFalse().cast(undefined);

  // $ExpectType true | undefined
  bool().isTrue().cast(undefined);

  const blDefault = bool().nullable().default(true).nullable();

  // $ExpectType boolean | null
  blDefault.cast('');

  // $ExpectType boolean | null
  blDefault.validateSync('');

  //
  const blDefaultRequired = bool().nullable().required().default(true);

  // $ExpectType NonNullable<boolean | null | undefined>
  blDefaultRequired.cast('');

  // $ExpectType NonNullable<boolean | null | undefined>
  blDefaultRequired.validateSync(null);

  // $ExpectType boolean | undefined
  bool().strip().cast(undefined);

  // $ExpectType boolean | undefined
  bool().strip().strip(false).cast(undefined);
}

Lazy: {
  const l = lazy(() => string().default('asfasf'));

  // $ExpectType string
  l.cast(null);

  const l2 = lazy((v) =>
    v ? string().default('asfasf') : number().required(),
  );

  // $ExpectType string | number
  l2.cast(null);
}

Array: {
  const arrRequired = array().required();

  // $ExpectType any[]
  arrRequired.cast(undefined);

  // $ExpectType any[] | null
  arrRequired.nullable().cast(undefined);

  // $ExpectType any[]
  arrRequired.nullable().nonNullable().cast(undefined);

  //
  const arrOptional = array().optional();

  // $ExpectType any[] | undefined
  arrOptional.cast(undefined);

  // $ExpectType any[]
  arrOptional.defined().cast(undefined);

  //
  const arrNullableOptional = array().nullable().optional();

  // $ExpectType any[] | null | undefined
  arrNullableOptional.cast('');

  // $ExpectType any[]
  arrNullableOptional.required().validateSync('');

  //
  //
  const arrNullable = array().nullable();

  // $ExpectType any[] | null | undefined
  arrNullable.validateSync('');

  const arrDefined = array().default(() => [] as unknown[]);

  // $ExpectType unknown[]
  arrDefined.getDefault();

  const arrDefault = array()
    .optional()
    .default(() => [] as unknown[])
    .nullable()
    .min(1);

  // $ExpectType any[] | null
  arrDefault.cast('');

  // $ExpectType any[] | null
  arrDefault.validateSync('');

  //
  const arrDefaultRequired = array()
    .nullable()
    .required()
    .default(() => [] as unknown[]);

  // $ExpectType any[]
  arrDefaultRequired.cast('');

  // $ExpectType any[]
  arrDefaultRequired.validateSync(null);

  array().default<string[]>(() => []);

  // $ExpectType (string | undefined)[] | undefined
  array(string()).cast(null);

  // $ExpectType (string | undefined)[] | null
  array().defined().nullable().of(string()).cast(null);

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

  // $ExpectType number[]
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

  // $ExpectType number[]
  array(number()).default(numList).getDefault();

  // $ExpectType (number | undefined)[]
  array(number()).concat(array(number()).required()).validateSync([]);

  // $ExpectType any[] | undefined
  array().strip().cast(undefined);

  // $ExpectType any[] | undefined
  array().strip().strip(false).cast(undefined);

  ArrayConcat: {
    const arrReq = array(number()).required();

    // $ExpectType (number | undefined)[]
    const _c1 = array(number()).concat(arrReq).validateSync([]);
  }
}

Tuple: {
  // $ExpectType [number, string | undefined, { age: number; }] | undefined
  tuple([
    number().defined(),
    string(),
    object({ age: number().required() }),
  ]).cast([3, 4]);

  const tplRequired = tuple([
    string().required(),
    string().required(),
  ]).required();

  // $ExpectType [string, string]
  tplRequired.cast(undefined);

  // $ExpectType [string, string] | null
  tplRequired.nullable().cast(undefined);

  // $ExpectType [string, string]
  tplRequired.nullable().nonNullable().cast(undefined);

  //
  const tplOptional = tuple([
    string().required(),
    string().required(),
  ]).optional();

  // $ExpectType [string, string] | undefined
  tplOptional.cast(undefined);

  // $ExpectType [string, string]
  tplOptional.defined().cast(undefined);

  //
  const tplNullableOptional = tuple([string().required(), string().required()])
    .nullable()
    .optional();

  // $ExpectType [string, string] | null | undefined
  tplNullableOptional.cast('');

  // $ExpectType [string, string]
  tplNullableOptional.required().validateSync('');

  //
  const tplNullable = tuple([
    string().required(),
    string().required(),
  ]).nullable();

  // $ExpectType [string, string] | null | undefined
  tplNullable.validateSync('');

  const tplDefined = tuple([string().required(), string().required()]).default(
    () => ['', ''],
  );

  // $ExpectType [string, string]
  tplDefined.getDefault();

  const tplDefault = tuple([string().required(), string().required()])
    .nullable()
    .default(['', ''])
    .nullable();

  // $ExpectType [string, string] | null
  tplDefault.cast('');

  // $ExpectType [string, string] | null
  tplDefault.validateSync('');

  // $ExpectType TupleSchema<[string, string], AnyObject, [string, string], "d">
  const tplDefaultRequired = tuple([string().required(), string().required()])
    .nullable()
    .required()
    .default(() => ['', '']);

  // $ExpectType [string, string]
  tplDefaultRequired.cast('');

  // $ExpectType [string, string]
  tplDefaultRequired.validateSync(null);
}

Object: {
  const objRequired = object().required();

  // $ExpectType {}
  objRequired.cast(undefined);

  // $ExpectType {} | null
  objRequired.nullable().cast(undefined);

  // $ExpectType {}
  objRequired.nullable().nonNullable().cast(undefined);

  //
  const objOptional = object().optional();

  // FIXME: should not be undefined
  // $ExpectType {} | undefined
  objOptional.cast(undefined);

  // $ExpectType {}
  objOptional.defined().cast(undefined);

  //
  const objNullableOptional = object().nullable().optional();

  // FIXME: should not be undefined
  // $ExpectType {} | null | undefined
  objNullableOptional.cast('');

  // $ExpectType {}
  objNullableOptional.required().validateSync('');

  //
  //
  const objNullable = object().nullable();

  // $ExpectType {} | null
  objNullable.validateSync('');

  const v = object({
    name: string().defined(),
    colors: array(string().defined()).required(),
  }).nullable();

  // $ExpectType { name: string; colors: string[]; } | null
  v.cast({});

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
    removed: number().strip().default(0),
    ref: ref('string'),
    nest: object({
      other: string(),
    }),
    nullObject: object({
      other: string(),
    }).default(null),
    lazy: lazy(() => number().defined()),
  });

  const cast1 = obj.cast({});

  let _f = obj.getDefault();

  // $ExpectType string | undefined
  cast1!.nest!.other;

  // $ExpectType "foo"
  cast1!.string;

  // @ts-expect-error Removed doesn't exist
  cast1!.removed;

  // $ExpectType number
  cast1!.number;

  // $ExpectType string
  string().strip().default('').cast('');

  // $ExpectType { string?: string | undefined; }
  const _cast2 = object({
    string: string().strip().strip(false),
  }).cast(undefined);

  //
  // Object Defaults
  //
  const dflt1 = obj.getDefault();

  // $ExpectType 1
  dflt1.number;

  // $ExpectType undefined
  dflt1.ref;

  // $ExpectType undefined
  dflt1.lazy;

  // $ExpectType undefined
  dflt1.string;

  // $ExpectType undefined
  dflt1.nest.other;

  // $ExpectType null
  dflt1.nullObject;

  const merge = object({
    field: string().required(),
    other: string().default(''),
  }).shape({
    field: number().default(1),
    name: string(),
  });

  // $ExpectType { name?: string | undefined; other: string; field: number; }
  merge.cast({});

  // $ExpectType number
  merge.cast({}).field;

  // $ExpectType string
  merge.cast({}).other;

  Concat: {
    const obj1 = object({
      field: string().required(),
      other: string().default(''),
    });

    const obj2 = object({
      field: number().default(1),
      name: string(),
    }).nullable();

    // $ExpectType { name?: string | undefined; other: string; field: number; } | null
    obj1.concat(obj2).cast('');

    // $ExpectType { name?: string | undefined; other: string; field: number; }
    obj1.nullable().concat(obj2.nonNullable()).cast('');

    // $ExpectType { field: 1; other: ""; name: undefined; }
    obj1.nullable().concat(obj2.nonNullable()).getDefault();

    // $ExpectType null
    obj1.concat(obj2.default(null)).getDefault();

    const optionalNonDefaultedObj = object({
      nested: object({
        h: number().required(),
      })
        .default(undefined)
        .optional(),
    });

    // $ExpectType { h: number; } | undefined
    optionalNonDefaultedObj.cast({}).nested;
  }

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

    const _t: ObjectSchema<EmployeeWithPromotions> = object({
      name: string().defined(),
      promotion_dates: array().of(date().defined()).defined(),
    });
  }

  SchemaOfFileArray: {
    type DocumentWithFullHistory = {
      history?: File[];
      name: string;
    };

    const _t: ObjectSchema<DocumentWithFullHistory> = object({
      name: string().defined(),
      history: array().of(mixed<File>().defined()),
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

    // $ExpectType { age?: number | undefined; }
    schema.pick(['age']).validateSync({ age: '1' });
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

    // $ExpectType { name: string; }
    schema.omit(['age']).validateSync({ name: '1' });
  }

  ObjectPartial: {
    const schema = object({
      // age: number(),
      name: string().required(),
      lazy: lazy(() => number().defined()),
      address: object()
        .shape({
          line1: string().required(),
          zip: number().required().strip(),
        })
        .default(undefined),
    }).nullable();

    const partial = schema.partial();

    // $ExpectType string | undefined
    partial.validateSync({})!.name;

    // $ExpectType string
    partial.validateSync({})!.address!.line1;

    // $ExpectType number | undefined
    partial.validateSync({})!.lazy;

    const deepPartial = schema.deepPartial();

    // $ExpectType string | undefined
    deepPartial.validateSync({})!.name;

    // $ExpectType string | undefined
    deepPartial.validateSync({})!.address!.line1;

    // $ExpectType number | undefined
    deepPartial.validateSync({})!.lazy;
  }
}

// Conditions: {
//   // $ExpectType NumberSchema<number | undefined, AnyObject, undefined, ""> | StringSchema<string, AnyObject, undefined, "">
//   string().when('foo', ([foo], schema) => (foo ? schema.required() : number()));

//   // $ExpectType StringSchema<string | undefined, AnyObject, undefined, "">
//   string()
//     .when('foo', ([foo], schema) => (foo ? schema.required() : schema))
//     .when('foo', ([foo], schema) => (foo ? schema.required() : schema));

//   // $ExpectType NumberSchema<number | undefined, AnyObject, undefined, ""> | StringSchema<string, AnyObject, undefined, "">
//   string().when('foo', {
//     is: true,
//     then: () => number(),
//     otherwise: (s) => s.required(),
//   });

//   const result = object({
//     foo: bool().defined(),
//     polyField: mixed<string>().when('foo', {
//       is: true,
//       then: () => number(),
//       otherwise: (s) => s.required(),
//     }),
//   }).cast({ foo: true, polyField: '1' });

//   // $ExpectType { polyField?: string | number | undefined; foo: boolean; }
//   result;

//   mixed()
//     .when('foo', ([foo]) => (foo ? string() : number()))
//     .min(1);
// }

TypeAssigning: {
  const _schema: ObjectSchema<{
    mtime?: Date | null | undefined;
    toJSON: () => any;
  }> = object({
    mtime: date().nullable(),
    toJSON: mixed<() => any>().required(),
  });
}

reach: {
  const obj = object({
    string: string<'foo'>().defined(),
    number: number().default(1),
    removed: number().strip(),
    ref: ref<'foo'>('string'),
    nest: array(
      object({
        other: string(),
      }),
    ),
    nullObject: object({
      other: string(),
    }).default(null),
    lazy: lazy(() => number().defined()),
  });

  // $ExpectType ISchema<string | undefined, AnyObject, any, any> | Reference<string | undefined>
  const _1 = reach(obj, 'nest[0].other' as const);

  // $ExpectType Reference<{ other?: string | undefined; } | undefined> | ISchema<{ other?: string | undefined; } | undefined, AnyObject, any, any>
  const _2 = reach(obj, 'nest[0]' as const);

  // $ExpectType Reference<"foo"> | ISchema<"foo", AnyObject, any, any>
  const _3 = reach(obj, 'ref');
}

addMethod: {
  addMethod(Schema, 'foo', function () {
    return this.clone();
  });

  addMethod(string, 'foo', function () {
    return this.clone();
  });
}
