# Yup

Yup is a schema builder for runtime value parsing and validation. Define a schema, transform a value to match, assert the shape of an existing value, or both. Yup schema are extremely expressive and allow modeling complex, interdependent validations, or value transformation.

**Killer Features**:

- Concise yet expressive schema interface, equipped to model simple to complex data models
- Powerful TypeScript support. Infer static types from schema, or ensure schema correctly implement a type
- Built-in async validation support. Model server-side and client-side validation equally well
- Extensible: add your own type-safe methods and schema
- Rich error details, make debugging a breeze

## Getting Started

Schema are comprised of parsing actions (transforms) as well as assertions (tests) about the input value.
Validate an input value to parse it and run the configured set of assertions. Chain together methods to build a schema.

```ts
import { object, string, string, date, InferType } from 'yup';

let userSchema = object({
  name: string().required(),
  age: number().required().positive().integer(),
  email: string().email(),
  website: string().url().nullable(),
  createdOn: date().default(() => new Date()),
});

// parse and assert validity
const user = await userSchema.validate(await fetchUser());

type User = InferType<typeof userSchema>;
/* {
  name: string;
  age: number;
  email?: string | undefined
  website?: string | null | undefined
  createdOn: Date
}*/
```

Use a schema to coerce or "cast" an input value into the correct type, and optionally
transform that value into more concrete and specific values, without making further assertions.

```ts
// Attempts to coarce values to the correct type
const parsedUser = userSchema.cast({
  name: 'jimmy',
  age: '24',
  createdOn: '2014-09-23T19:25:25Z',
});
// ✅  { name: 'jimmy', age: 24, createdOn: Date }
```

Know that your input value is already parsed? You can "strictly" validate an input, and avoid the overhead
of running parsing logic.

```ts
// ❌  ValidationError "age is not a number"
const parsedUser = await userSchema.validate(
  {
    name: 'jimmy',
    age: '24',
  },
  { strict: true },
);
```

## Table of Contents

<!-- The exported functions are factory methods for constructing schema instances, but without the `new` keyword.
If you need access to the actual schema classes, they are also exported:

```js
import {
  BooleanSchema,
  DateSchema,
  MixedSchema,
  NumberSchema,
  ArraySchema,
  ObjectSchema,
  StringSchema,
} from 'yup';
``` -->

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Schema basics](#schema-basics)
  - [Parsing: Transforms](#parsing-transforms)
  - [Validation: Tests](#validation-tests)
  - [Composition and Reuse](#composition-and-reuse)
- [TypeScript integration](#typescript-integration)
  - [Schema defaults](#schema-defaults)
  - [Ensuring a schema matches an existing type](#ensuring-a-schema-matches-an-existing-type)
  - [Extending built-in schema with new methods](#extending-built-in-schema-with-new-methods)
  - [TypeScript configuration](#typescript-configuration)
- [Error message customization](#error-message-customization)
  - [localization and i18n](#localization-and-i18n)
- [API](#api)
  - [`yup`](#yup)
    - [`yup.reach(schema: Schema, path: string, value?: object, context?: object): Schema`](#yupreachschema-schema-path-string-value-object-context-object-schema)
    - [`yup.addMethod(schemaType: Schema, name: string, method: ()=> Schema): void`](#yupaddmethodschematype-schema-name-string-method--schema-void)
    - [`yup.ref(path: string, options: { contextPrefix: string }): Ref`](#yuprefpath-string-options--contextprefix-string--ref)
    - [`yup.lazy((value: any) => Schema): Lazy`](#yuplazyvalue-any--schema-lazy)
    - [`ValidationError(errors: string | Array<string>, value: any, path: string)`](#validationerrorerrors-string--arraystring-value-any-path-string)
  - [mixed](#mixed)
    - [`mixed.clone(): Schema`](#mixedclone-schema)
    - [`mixed.label(label: string): Schema`](#mixedlabellabel-string-schema)
    - [`mixed.meta(metadata: object): Schema`](#mixedmetametadata-object-schema)
    - [`mixed.describe(): SchemaDescription`](#mixeddescribe-schemadescription)
    - [`mixed.concat(schema: Schema): Schema`](#mixedconcatschema-schema-schema)
    - [`mixed.validate(value: any, options?: object): Promise<any, ValidationError>`](#mixedvalidatevalue-any-options-object-promiseany-validationerror)
    - [`mixed.validateSync(value: any, options?: object): any`](#mixedvalidatesyncvalue-any-options-object-any)
    - [`mixed.validateAt(path: string, value: any, options?: object): Promise<any, ValidationError>`](#mixedvalidateatpath-string-value-any-options-object-promiseany-validationerror)
    - [`mixed.validateSyncAt(path: string, value: any, options?: object): any`](#mixedvalidatesyncatpath-string-value-any-options-object-any)
    - [`mixed.isValid(value: any, options?: object): Promise<boolean>`](#mixedisvalidvalue-any-options-object-promiseboolean)
    - [`mixed.isValidSync(value: any, options?: object): boolean`](#mixedisvalidsyncvalue-any-options-object-boolean)
    - [`mixed.cast(value: any, options = {}): any`](#mixedcastvalue-any-options---any)
    - [`mixed.isType(value: any): boolean`](#mixedistypevalue-any-boolean)
    - [`mixed.strict(isStrict: boolean = false): Schema`](#mixedstrictisstrict-boolean--false-schema)
    - [`mixed.strip(stripField: boolean = true): Schema`](#mixedstripstripfield-boolean--true-schema)
    - [`mixed.withMutation(builder: (current: Schema) => void): void`](#mixedwithmutationbuilder-current-schema--void-void)
    - [`mixed.default(value: any): Schema`](#mixeddefaultvalue-any-schema)
    - [`mixed.getDefault(options?: object): Any`](#mixedgetdefaultoptions-object-any)
    - [`mixed.nullable(isNullable: boolean = true): Schema`](#mixednullableisnullable-boolean--true-schema)
    - [`mixed.required(message?: string | function): Schema`](#mixedrequiredmessage-string--function-schema)
    - [`mixed.notRequired(): Schema` Alias: `optional()`](#mixednotrequired-schema-alias-optional)
    - [`mixed.defined(): Schema`](#mixeddefined-schema)
    - [`mixed.typeError(message: string): Schema`](#mixedtypeerrormessage-string-schema)
    - [`mixed.oneOf(arrayOfValues: Array<any>, message?: string | function): Schema` Alias: `equals`](#mixedoneofarrayofvalues-arrayany-message-string--function-schema-alias-equals)
    - [`mixed.notOneOf(arrayOfValues: Array<any>, message?: string | function)`](#mixednotoneofarrayofvalues-arrayany-message-string--function)
    - [`mixed.when(keys: string | string[], builder: object | (values: any[], schema) => Schema): Schema`](#mixedwhenkeys-string--string-builder-object--values-any-schema--schema-schema)
    - [`mixed.test(name: string, message: string | function, test: function): Schema`](#mixedtestname-string-message-string--function-test-function-schema)
    - [`mixed.test(options: object): Schema`](#mixedtestoptions-object-schema)
    - [`mixed.transform((currentValue: any, originalValue: any) => any): Schema`](#mixedtransformcurrentvalue-any-originalvalue-any--any-schema)
  - [string](#string)
    - [`string.required(message?: string | function): Schema`](#stringrequiredmessage-string--function-schema)
    - [`string.length(limit: number | Ref, message?: string | function): Schema`](#stringlengthlimit-number--ref-message-string--function-schema)
    - [`string.min(limit: number | Ref, message?: string | function): Schema`](#stringminlimit-number--ref-message-string--function-schema)
    - [`string.max(limit: number | Ref, message?: string | function): Schema`](#stringmaxlimit-number--ref-message-string--function-schema)
    - [`string.matches(regex: Regex, message?: string | function): Schema`](#stringmatchesregex-regex-message-string--function-schema)
    - [`string.matches(regex: Regex, options: { message: string, excludeEmptyString: bool }): Schema`](#stringmatchesregex-regex-options--message-string-excludeemptystring-bool--schema)
    - [`string.email(message?: string | function): Schema`](#stringemailmessage-string--function-schema)
    - [`string.url(message?: string | function): Schema`](#stringurlmessage-string--function-schema)
    - [`string.uuid(message?: string | function): Schema`](#stringuuidmessage-string--function-schema)
    - [`string.ensure(): Schema`](#stringensure-schema)
    - [`string.trim(message?: string | function): Schema`](#stringtrimmessage-string--function-schema)
    - [`string.lowercase(message?: string | function): Schema`](#stringlowercasemessage-string--function-schema)
    - [`string.uppercase(message?: string | function): Schema`](#stringuppercasemessage-string--function-schema)
  - [number](#number)
    - [`number.min(limit: number | Ref, message?: string | function): Schema`](#numberminlimit-number--ref-message-string--function-schema)
    - [`number.max(limit: number | Ref, message?: string | function): Schema`](#numbermaxlimit-number--ref-message-string--function-schema)
    - [`number.lessThan(max: number | Ref, message?: string | function): Schema`](#numberlessthanmax-number--ref-message-string--function-schema)
    - [`number.moreThan(min: number | Ref, message?: string | function): Schema`](#numbermorethanmin-number--ref-message-string--function-schema)
    - [`number.positive(message?: string | function): Schema`](#numberpositivemessage-string--function-schema)
    - [`number.negative(message?: string | function): Schema`](#numbernegativemessage-string--function-schema)
    - [`number.integer(message?: string | function): Schema`](#numberintegermessage-string--function-schema)
    - [`number.truncate(): Schema`](#numbertruncate-schema)
    - [`number.round(type: 'floor' | 'ceil' | 'trunc' | 'round' = 'round'): Schema`](#numberroundtype-floor--ceil--trunc--round--round-schema)
  - [boolean](#boolean)
  - [date](#date)
    - [`date.min(limit: Date | string | Ref, message?: string | function): Schema`](#dateminlimit-date--string--ref-message-string--function-schema)
    - [`date.max(limit: Date | string | Ref, message?: string | function): Schema`](#datemaxlimit-date--string--ref-message-string--function-schema)
  - [array](#array)
    - [`array.of(type: Schema): Schema`](#arrayoftype-schema-schema)
    - [`array.length(length: number | Ref, message?: string | function): Schema`](#arraylengthlength-number--ref-message-string--function-schema)
    - [`array.min(limit: number | Ref, message?: string | function): Schema`](#arrayminlimit-number--ref-message-string--function-schema)
    - [`array.max(limit: number | Ref, message?: string | function): Schema`](#arraymaxlimit-number--ref-message-string--function-schema)
    - [`array.ensure(): Schema`](#arrayensure-schema)
    - [`array.compact(rejector: (value) => boolean): Schema`](#arraycompactrejector-value--boolean-schema)
  - [object](#object)
    - [Object schema defaults](#object-schema-defaults)
    - [`object.shape(fields: object, noSortEdges?: Array<[string, string]>): Schema`](#objectshapefields-object-nosortedges-arraystring-string-schema)
    - [`object.concat(schemaB: ObjectSchema): ObjectSchema`](#objectconcatschemab-objectschema-objectschema)
    - [`object.pick(keys: string[]): Schema`](#objectpickkeys-string-schema)
    - [`object.omit(keys: string[]): Schema`](#objectomitkeys-string-schema)
    - [`object.getDefaultFromShape(): Record<string, unknown>`](#objectgetdefaultfromshape-recordstring-unknown)
    - [`object.from(fromKey: string, toKey: string, alias: boolean = false): this`](#objectfromfromkey-string-tokey-string-alias-boolean--false-this)
    - [`object.noUnknown(onlyKnownKeys: boolean = true, message?: string | function): Schema`](#objectnounknownonlyknownkeys-boolean--true-message-string--function-schema)
    - [`object.camelCase(): Schema`](#objectcamelcase-schema)
    - [`object.constantCase(): Schema`](#objectconstantcase-schema)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Schema basics

Schema definitions, are comprised of parsing "transforms" which manipulate inputs into the desired shape and type, "tests", which make assertions over parsed data. Schema also store a bunch of "metadata", details about the schema itself, which can be used to improve error messages, build tools that dynamically consume schema, or serialize schema into another format.

In order to be maximally flexible yup allows running both parsing and assertions separately to match specific needs

### Parsing: Transforms

Each built-in type implements basic type parsing, which comes in handy when parsing serialized data, such as JSON.
Additionally types implement type specific transforms that can be enabled.

```ts
const num = number().cast('1'); // 1

const obj = object({
  firstName: string().lowercase().trim(),
})
  .camelCase()
  .cast('{"first_name": "jAnE "}'); // { firstName: 'jane' }
```

Custom transforms can be added

```ts
const reversedString = string()
  .transform((currentValue) => currentValue.split('').reverse().join(''))
  .cast('dlrow olleh'); // "hello world"
```

Transforms form a "pipeline", where the value of a previous transform is piped into the next one.
If the end value is `undefined` yup will apply the schema default if it's configured.

> Watch out! values are not guaranteed to be valid types in tranform functions. Previous transforms
> may have failed. For example a number transform may be receive the input value, `NaN`, or a number.

### Validation: Tests

yup has robust support for assertions, or "tests", over input values. Tests check that inputs conform to some
criteria. Tests are distinct from transforms, in that they do not change or alter the input (or its type)
and are usually reserved for checks that are hard, if not impossible, to represent in static types.

```ts
string()
  .min(3, 'must be at least 3 characters long')
  .email('must be a valid email')
  .validate('no'); // ValidationError
```

As with transforms, tests can be customized on the fly

```ts
const jamesSchema = string().test(
  'is-james',
  (d) => `${d.path} is not James`,
  (value) => value == null || value === 'James',
);

jamesSchema.validateSync('James'); // "James"

jamesSchema.validateSync('Jane'); // ValidationError "this is not James"
```

> Heads up: unlike transforms, `value` in a custom test is guaranteed to be the correct type
> (in this case an optional string). It still may be `undefined` or `null` depending on your schema
> in those cases, you may want to return `true` for absent values unless your transform, makes presence
> related assertions

### Composition and Reuse

Schema are immutable, each method call returns a new schema object. Reuse and pass them around without
fear of mutating another instance.

```ts
const optionalString = string().optional();

const definedString = optionalString.defined();

const value = undefined;
optionalString.isValid(value); // true
definedString.isValid(value); // false
```

## TypeScript integration

Yup schema produce, static TypeScript interfaces. Use `InferType` to extract that interface:

```ts
import * as yup from 'yup';

const personSchema = yup.object({
  firstName: yup.string().defined(),
  nickName: yup.string().default('').nullable(),
  sex: yup
    .mixed()
    .oneOf(['male', 'female', 'other'] as const)
    .defined(),
  email: yup.string().nullable().email(),
  birthDate: yup.date().nullable().min(new Date(1900, 0, 1)),
});

interface Person extends yup.InferType<typeof personSchema> {}
```

### Schema defaults

a schema's default is used when casting produces an `undefined` putput value. Because of this,
setting a default affects the output type of the schema, effectively marking it as "defined()".

```ts
import { string } from 'yup';

const value: string = string().default('hi').validate(undefined);

// vs

const value: string | undefined = string().validate(undefined);
```

### Ensuring a schema matches an existing type

In some cases, the TypeScript type already exists, and you want to ensure that
your schema produces a compatible type:

```ts
import { object, number string, ObjectSchema } from 'yup';

interface Person {
  name: string;
  age?: number;
  sex: 'male' | 'female' | 'other' | null;
}

// will raise a compile-time type error if the schema does not produce a valid Person
const schema: ObjectSchema<Person> = object({
  name: string().defined(),
  age: number().optional(),
  sex: string<'male' | 'female' | 'other'>().nullable().defined();
});

// ❌ errors:
// "Type 'number | undefined' is not assignable to type 'string'."
const badSchema: ObjectSchema<Person> = object({
  name: number(),
});

```

### Extending built-in schema with new methods

You can use TypeScript's interface merging behavior to extend the schema types
if needed. Type extensions should go in an "ambient" type definition file such as your
`globals.d.ts`. Remember to actually extend the yup type in your application code!

> Watch out! merging only works if the type definition is _exactly_ the same, including
> generics. Consult the yup source code for each type to ensure you are defining it correctly

```ts
// globals.d.ts
declare module 'yup' {
  interface StringSchema<TType, TContext, TDefault, TFlags> {
    append(appendStr: string): this;
  }
}

// app.ts
import { addMethod, string } from 'yup';

addMethod(string, 'append', function append(appendStr: string) {
  return this.transform((value) => `${value}${appendStr}`);
});

string().append('~~~~').cast('hi'); // 'hi~~~~'
```

### TypeScript configuration

You MUST have the `strictNullChecks` compiler option enabled.

We also recommend settings `strictFunctionTypes` to `false`, for functionally better types. Yes
this reduces overall soundness, however TypeScript already disables this check
anyway for methods and constructors (note from TS docs):

> During development of this feature, we discovered a large number of inherently
> unsafe class hierarchies, including some in the DOM. Because of this,
> the setting only applies to functions written in function syntax, not to those in method syntax:

Your mileage will vary, but we've found that this check doesn't prevent many of
real bugs, while increasing the amount of onerous explicit type casting in apps.

## Error message customization

Default error messages can be customized for when no message is provided with a validation test.
If any message is missing in the custom dictionary the error message will default to Yup's one.

```js
import { setLocale } from 'yup';

setLocale({
  mixed: {
    default: 'Não é válido',
  },
  number: {
    min: 'Deve ser maior que ${min}',
  },
});

// now use Yup schemas AFTER you defined your custom dictionary
let schema = yup.object().shape({
  name: yup.string(),
  age: yup.number().min(18),
});

try {
  await schema.validate({ name: 'jimmy', age: 11 });
} catch (err) {
  err.name; // => 'ValidationError'
  err.errors; // => ['Deve ser maior que 18']
}
```

### localization and i18n

If you need multi-language support, yup has got you covered. The function `setLocale` accepts functions that can be used to generate error objects with translation keys and values. These can be fed it into your favorite i18n library.

```js
import { setLocale } from 'yup';

setLocale({
  // use constant translation keys for messages without values
  mixed: {
    default: 'field_invalid',
  },
  // use functions to generate an error object that includes the value from the schema
  number: {
    min: ({ min }) => ({ key: 'field_too_short', values: { min } }),
    max: ({ max }) => ({ key: 'field_too_big', values: { max } }),
  },
});

// ...

let schema = yup.object().shape({
  name: yup.string(),
  age: yup.number().min(18),
});

try {
  await schema.validate({ name: 'jimmy', age: 11 });
} catch (err) {
  messages = err.errors.map((err) => i18next.t(err.key));
}
```

## API

### `yup`

The module export.

```js
let yup = require('yup');

yup.mixed;
yup.string;
yup.number;
yup.boolean; // also aliased as yup.bool
yup.date;
yup.object;
yup.array;

yup.reach;
yup.addMethod;
yup.ref;
yup.lazy;
yup.setLocale;
yup.ValidationError;
```

#### `yup.reach(schema: Schema, path: string, value?: object, context?: object): Schema`

For nested schemas `yup.reach` will retrieve a nested schema based on the provided path.

For nested schemas that need to resolve dynamically, you can provide a `value` and optionally
a `context` object.

```js
let schema = object().shape({
  nested: object().shape({
    arr: array().of(object().shape({ num: number().max(4) })),
  }),
});

reach(schema, 'nested.arr.num');
reach(schema, 'nested.arr[].num');
reach(schema, 'nested.arr[1].num');
reach(schema, 'nested["arr"][1].num');
```

#### `yup.addMethod(schemaType: Schema, name: string, method: ()=> Schema): void`

Adds a new method to the core schema types. A friendlier convenience method for `schemaType.prototype[name] = method`.

```js
yup.addMethod(yup.date, 'format', function (formats, parseStrict) {
  return this.transform(function (value, originalValue) {
    if (this.isType(value)) return value;

    value = Moment(originalValue, formats, parseStrict);

    return value.isValid() ? value.toDate() : new Date('');
  });
});
```

#### `yup.ref(path: string, options: { contextPrefix: string }): Ref`

Creates a reference to another sibling or sibling descendant field. Refs are resolved
at _validation/cast time_ and supported where specified. Refs are evaluated in the proper order so that
the ref value is resolved before the field using the ref (be careful of circular dependencies!).

```js
let schema = object({
  baz: ref('foo.bar'),
  foo: object({
    bar: string(),
  }),
  x: ref('$x'),
});

schema.cast({ foo: { bar: 'boom' } }, { context: { x: 5 } });
// => { baz: 'boom',  x: 5, foo: { bar: 'boom' } }
```

#### `yup.lazy((value: any) => Schema): Lazy`

Creates a schema that is evaluated at validation/cast time. Useful for creating
recursive schema like Trees, for polymorphic fields and arrays.

**CAUTION!** When defining parent-child recursive object schema, you want to reset the `default()`
to `null` on the child—otherwise the object will infinitely nest itself when you cast it!

```js
let node = object({
  id: number(),
  child: yup.lazy(() => node.default(undefined)),
});

let renderable = yup.lazy((value) => {
  switch (typeof value) {
    case 'number':
      return number();
    case 'string':
      return string();
    default:
      return mixed();
  }
});

let renderables = array().of(renderable);
```

#### `ValidationError(errors: string | Array<string>, value: any, path: string)`

Thrown on failed validations, with the following properties

- `name`: "ValidationError"
- `path`: a string, indicating where there error was thrown. `path` is empty at the root level.
- `errors`: array of error messages
- `inner`: in the case of aggregate errors, inner is an array of `ValidationErrors` throw earlier in the
  validation chain. When the `abortEarly` option is `false` this is where you can inspect each error thrown,
  alternatively, `errors` will have all of the messages from each inner error.

### mixed

Creates a schema that matches all types. All types inherit from this base type.

```ts
import { mixed } from 'yup';

let schema = mixed();

schema.validateSync('string'); // 'string';

schema.validateSync(1); // 1;

schema.validateSync(new Date()); // Date;
```

Custom types can be implemented by passing a type check function:

```ts
import { mixed } from 'yup';

let objectIdSchema = yup
  .mixed((input): input is ObjectId => input instanceof ObjectId)
  .transform((value: any, input, ctx) => {
    if (ctx.typeCheck(value)) return value;
    return new ObjectId(value);
  });

await objectIdSchema.validate(ObjectId('507f1f77bcf86cd799439011')); // ObjectId("507f1f77bcf86cd799439011")

await objectIdSchema.validate('507f1f77bcf86cd799439011'); // ObjectId("507f1f77bcf86cd799439011")
```

#### `mixed.clone(): Schema`

Creates a deep copy of the schema. Clone is used internally to return a new schema with every schema state change.

#### `mixed.label(label: string): Schema`

Overrides the key name which is used in error messages.

#### `mixed.meta(metadata: object): Schema`

Adds to a metadata object, useful for storing data with a schema, that doesn't belong
the cast object itself.

#### `mixed.describe(): SchemaDescription`

Collects schema details (like meta, labels, and active tests) into a serializable
description object.

```
SchemaDescription {
  type: string,
  label: string,
  meta: object,
  tests: Array<{ name: string, params: object }>
}
```

#### `mixed.concat(schema: Schema): Schema`

Creates a new instance of the schema by combining two schemas. Only schemas of the same type can be concatenated.
`concat` is not a "merge" function in the sense that all settings from the provided schema, override ones in the
base, including type, presence and nullability.

```ts
mixed<string>().defined().concat(mixed<number>().nullable());

// produces the equivalent to:

mixed<number>().defined().nullable();
```

#### `mixed.validate(value: any, options?: object): Promise<any, ValidationError>`

Returns the value (a cast value if `isStrict` is `false`) if the value is valid, and returns the errors otherwise.
This method is **asynchronous** and returns a Promise object, that is fulfilled with the value, or rejected
with a `ValidationError`.

The `options` argument is an object hash containing any schema options you may want to override
(or specify for the first time).

```js
Options = {
  strict: boolean = false;
  abortEarly: boolean = true;
  stripUnknown: boolean = false;
  recursive: boolean = true;
  context?: object;
}
```

- `strict`: only validate the input, and skip any coercion or transformation
- `abortEarly`: return from validation methods on the first error rather
  than after all validations run.
- `stripUnknown`: remove unspecified keys from objects.
- `recursive`: when `false` validations will not descend into nested schema
  (relevant for objects or arrays).
- `context`: any context needed for validating schema conditions (see: [`when()`](#mixedwhenkeys-string--arraystring-builder-object--value-schema-schema-schema))

```js
schema.validate({ name: 'jimmy', age: 24 }).then(function (value) {
  value; // => { name: 'jimmy',age: 24 }
});

schema.validate({ name: 'jimmy', age: 'hi' }).catch(function (err) {
  err.name; // => 'ValidationError'
  err.errors; // => ['age must be a number']
});
```

#### `mixed.validateSync(value: any, options?: object): any`

Runs validatations synchronously _if possible_ and returns the resulting value,
or throws a ValidationError. Accepts all the same options as `validate`.

Synchronous validation only works if there are no configured async tests, e.g tests that return a Promise.
For instance this will work:

```js
let schema = number().test(
  'is-42',
  "this isn't the number i want",
  (value) => value != 42,
);

schema.validateSync(23); // throws ValidationError
```

however this will not:

```js
let schema = number().test('is-42', "this isn't the number i want", (value) =>
  Promise.resolve(value != 42),
);

schema.validateSync(42); // throws Error
```

#### `mixed.validateAt(path: string, value: any, options?: object): Promise<any, ValidationError>`

Validate a deeply nested path within the schema. Similar to how `reach` works,
but uses the resulting schema as the subject for validation.

> Note! The `value` here is the _root_ value relative to the starting schema, not the value at the nested path.

```js
let schema = object({
  foo: array().of(
    object({
      loose: boolean(),
      bar: string().when('loose', {
        is: true,
        otherwise: (schema) => schema.strict(),
      }),
    }),
  ),
});

let rootValue = {
  foo: [{ bar: 1 }, { bar: 1, loose: true }],
};

await schema.validateAt('foo[0].bar', rootValue); // => ValidationError: must be a string

await schema.validateAt('foo[1].bar', rootValue); // => '1'
```

#### `mixed.validateSyncAt(path: string, value: any, options?: object): any`

Same as `validateAt` but synchronous.

#### `mixed.isValid(value: any, options?: object): Promise<boolean>`

Returns `true` when the passed in value matches the schema. `isValid`
is **asynchronous** and returns a Promise object.

Takes the same options as `validate()`.

#### `mixed.isValidSync(value: any, options?: object): boolean`

Synchronously returns `true` when the passed in value matches the schema.

Takes the same options as `validateSync()` and has the same caveats around async tests.

#### `mixed.cast(value: any, options = {}): any`

Attempts to coerce the passed in value to a value that matches the schema. For example: `'5'` will
cast to `5` when using the `number()` type. Failed casts generally return `null`, but may also
return results like `NaN` and unexpected strings.

`options` parameter can be an object containing `context`. (For more info on `context` see `mixed.validate`)

#### `mixed.isType(value: any): boolean`

Runs a type check against the passed in `value`. It returns true if it matches,
it does not cast the value. When `nullable()` is set `null` is considered a valid value of the type.
You should use `isType` for all Schema type checks.

#### `mixed.strict(isStrict: boolean = false): Schema`

Sets the `strict` option to `true`. Strict schemas skip coercion and transformation attempts,
validating the value "as is".

#### `mixed.strip(stripField: boolean = true): Schema`

Marks a schema to be removed from an output object. Only works as a nested schema.

```js
let schema = object({
  useThis: number(),
  notThis: string().strip(),
});

schema.cast({ notThis: 'foo', useThis: 4 }); // => { useThis: 4 }
```

#### `mixed.withMutation(builder: (current: Schema) => void): void`

First the legally required Rich Hickey quote:

> If a tree falls in the woods, does it make a sound?
>
> If a pure function mutates some local data in order to produce an immutable return value, is that ok?

`withMutation` allows you to mutate the schema in place, instead of the default behavior which clones before each change.
Generally this isn't necessary since the vast majority of schema changes happen during the initial
declaration, and only happen once over the lifetime of the schema, so performance isn't an issue.
However certain mutations _do_ occur at cast/validation time, (such as conditional schema using [`when()`](#mixedwhenkeys-string--arraystring-builder-object--value-schema-schema-schema)), or
when instantiating a schema object.

```js
object()
  .shape({ key: string() })
  .withMutation((schema) => {
    return arrayOfObjectTests.forEach((test) => {
      schema.test(test);
    });
  });
```

#### `mixed.default(value: any): Schema`

Sets a default value to use when the value is `undefined`.
Defaults are created after transformations are executed, but before validations, to help ensure that safe
defaults are specified. The default value will be cloned on each use, which can incur performance penalty
for objects and arrays. To avoid this overhead you can also pass a function that returns a new default.
Note that `null` is considered a separate non-empty value.

```js
yup.string.default('nothing');

yup.object.default({ number: 5 }); // object will be cloned every time a default is needed

yup.object.default(() => ({ number: 5 })); // this is cheaper

yup.date.default(() => new Date()); // also helpful for defaults that change over time
```

#### `mixed.getDefault(options?: object): Any`

Retrieve a previously set default value. `getDefault` will resolve any conditions that may alter the default. Optionally pass `options` with `context` (for more info on `context` see `mixed.validate`).

#### `mixed.nullable(isNullable: boolean = true): Schema`

Indicates that `null` is a valid value for the schema. Without `nullable()`
`null` is treated as a different type and will fail `isType()` checks.

#### `mixed.required(message?: string | function): Schema`

Mark the schema as required, which will not allow `undefined` or `null` as a value.
Note that unless a schema is marked as `nullable()` a `null` value is treated as a type error, not a missing value. Mark a schema as `mixed().nullable().required()` treat `null` as missing.

> Watch out! [`string().required`](#stringrequiredmessage-string--function-schema)) works a little
> different and additionally prevents empty string values (`''`) when required.

#### `mixed.notRequired(): Schema` Alias: `optional()`

Mark the schema as not required. Passing `undefined` (or `null` for nullable schema) as value will not fail validation.

#### `mixed.defined(): Schema`

Require a value for the schema. All field values apart from `undefined` meet this requirement.

#### `mixed.typeError(message: string): Schema`

Define an error message for failed type checks. The `${value}` and `${type}` interpolation can
be used in the `message` argument.

#### `mixed.oneOf(arrayOfValues: Array<any>, message?: string | function): Schema` Alias: `equals`

Only allow values from set of values. Values added are removed from any `notOneOf` values if present.
The `${values}` interpolation can be used in the `message` argument. If a ref or refs are provided,
the `${resolved}` interpolation can be used in the message argument to get the resolved values that were checked
at validation time.

Note that `undefined` does not fail this validator, even when `undefined` is not included in `arrayOfValues`.
If you don't want `undefined` to be a valid value, you can use `mixed.required`.

```js
let schema = yup.mixed().oneOf(['jimmy', 42]);

await schema.isValid(42); // => true
await schema.isValid('jimmy'); // => true
await schema.isValid(new Date()); // => false
```

#### `mixed.notOneOf(arrayOfValues: Array<any>, message?: string | function)`

Disallow values from a set of values. Values added are removed from `oneOf` values if present.
The `${values}` interpolation can be used in the `message` argument. If a ref or refs are provided,
the `${resolved}` interpolation can be used in the message argument to get the resolved values that were checked
at validation time.

```js
let schema = yup.mixed().notOneOf(['jimmy', 42]);

await schema.isValid(42); // => false
await schema.isValid(new Date()); // => true
```

#### `mixed.when(keys: string | string[], builder: object | (values: any[], schema) => Schema): Schema`

Adjust the schema based on a sibling or sibling children fields. You can provide an object
literal where the key `is` is value or a matcher function, `then` provides the true schema and/or
`otherwise` for the failure condition.

`is` conditions are strictly compared (`===`) if you want to use a different form of equality you
can provide a function like: `is: (value) => value == true`.

Like joi you can also prefix properties with `$` to specify a property that is dependent
on `context` passed in by `validate()` or `isValid`. `when` conditions are additive.

```js
let schema = object({
  isBig: boolean(),
  count: number()
    .when('isBig', {
      is: true, // alternatively: (val) => val == true
      then: (schema) => schema..min(5),
      otherwise: (schema) => schema..min(0),
    })
    .when('$other', (other, schema) => (other === 4 ? schema.max(6) : schema)),
});

await schema.validate(value, { context: { other: 4 } });
```

You can also specify more than one dependent key, in which case each value will be spread as an argument.

```js
let schema = object({
  isSpecial: boolean(),
  isBig: boolean(),
  count: number().when(['isBig', 'isSpecial'], {
    is: true, // alternatively: (isBig, isSpecial) => isBig && isSpecial
    then: (schema) => schema..min(5),
    otherwise: (schema) => schema..min(0),
  }),
});

await schema.validate({
  isBig: true,
  isSpecial: true,
  count: 10,
});
```

Alternatively you can provide a function that returns a schema
(called with the value of the key and the current schema).

```js
let schema = yup.object({
  isBig: yup.boolean(),
  count: yup.number().when('isBig', (isBig, schema) => {
    return isBig ? schema.min(5) : schema.min(0);
  }),
});

await schema.validate({ isBig: false, count: 4 });
```

#### `mixed.test(name: string, message: string | function, test: function): Schema`

Adds a test function to the validation chain. Tests are run after any object is cast.
Many types have some tests built in, but you can create custom ones easily.
In order to allow asynchronous custom validations _all_ (or no) tests are run asynchronously.
A consequence of this is that test execution order cannot be guaranteed.

All tests must provide a `name`, an error `message` and a validation function that must return
`true` when the current `value` is valid and `false` or a `ValidationError` otherwise.
To make a test async return a promise that resolves `true` or `false` or a `ValidationError`.

For the `message` argument you can provide a string which will interpolate certain values
if specified using the `${param}` syntax. By default all test messages are passed a `path` value
which is valuable in nested schemas.

The `test` function is called with the current `value`. For more advanced validations you can
use the alternate signature to provide more options (see below):

```js
let jimmySchema = string().test(
  'is-jimmy',
  '${path} is not Jimmy',
  (value, context) => value === 'jimmy',
);

// or make it async by returning a promise
let asyncJimmySchema = string().test(
  'is-jimmy',
  '${path} is not Jimmy',
  async (value, testContext) => (await fetch('/is-jimmy/' + value)).responseText === 'true',
});

await schema.isValid('jimmy'); // => true
await schema.isValid('john'); // => false
```

Test functions are called with a special context value, as the second argument, that exposes some useful metadata
and functions. For non arrow functions, the test context is also set as the function `this`. Watch out, if you access
it via `this` it won't work in an arrow function.

- `testContext.path`: the string path of the current validation
- `testContext.schema`: the resolved schema object that the test is running against.
- `testContext.options`: the `options` object that validate() or isValid() was called with
- `testContext.parent`: in the case of nested schema, this is the value of the parent object
- `testContext.originalValue`: the original value that is being tested
- `testContext.createError(Object: { path: String, message: String, params: Object })`: create and return a
  validation error. Useful for dynamically setting the `path`, `params`, or more likely, the error `message`.
  If either option is omitted it will use the current path, or default message.

#### `mixed.test(options: object): Schema`

Alternative `test(..)` signature. `options` is an object containing some of the following options:

```js
Options = {
  // unique name identifying the test
  name: string;
  // test function, determines schema validity
  test: (value: any) => boolean;
  // the validation error message
  message: string;
  // values passed to message for interpolation
  params: ?object;
  // mark the test as exclusive, meaning only one of the same can be active at once
  exclusive: boolean = false;
}
```

In the case of mixing exclusive and non-exclusive tests the following logic is used.
If a non-exclusive test is added to a schema with an exclusive test of the same name
the exclusive test is removed and further tests of the same name will be stacked.

If an exclusive test is added to a schema with non-exclusive tests of the same name
the previous tests are removed and further tests of the same name will replace each other.

```js
let max = 64;
let schema = yup.mixed().test({
  name: 'max',
  exclusive: true,
  params: { max },
  message: '${path} must be less than ${max} characters',
  test: (value) => value == null || value.length <= max,
});
```

#### `mixed.transform((currentValue: any, originalValue: any) => any): Schema`

Adds a transformation to the transform chain. Transformations are central to the casting process,
default transforms for each type coerce values to the specific type (as verified by [`isType()`](#mixedistypevalue-any-boolean)). transforms are run before validations and only applied when the schema is not marked as `strict` (the default). Some types have built in transformations.

Transformations are useful for arbitrarily altering how the object is cast, **however, you should take care
not to mutate the passed in value.** Transforms are run sequentially so each `value` represents the
current state of the cast, you can use the `originalValue` param if you need to work on the raw initial value.

```js
let schema = string().transform(function (value, originalvalue) {
  return this.isType(value) && value !== null ? value.toUpperCase() : value;
});

schema.cast('jimmy'); // => 'JIMMY'
```

Each types will handle basic coercion of values to the proper type for you, but occasionally
you may want to adjust or refine the default behavior. For example, if you wanted to use a different
date parsing strategy than the default one you could do that with a transform.

```js
module.exports = function (formats = 'MMM dd, yyyy') {
  return date().transform(function (value, originalValue) {
    // check to see if the previous transform already parsed the date
    if (this.isType(value)) return value;

    // the default coercion failed so let's try it with Moment.js instead
    value = Moment(originalValue, formats);

    // if it's valid return the date object, otherwise return an `InvalidDate`
    return value.isValid() ? value.toDate() : new Date('');
  });
};
```

### string

Define a string schema. Supports all the same methods as [`mixed`](#mixed).

```js
let schema = yup.string();

await schema.isValid('hello'); // => true
```

By default, the `cast` logic of `string` is to call `toString` on the value if it exists.
empty values are not coerced (use `ensure()` to coerce empty values to empty strings).

Failed casts return the input value.

#### `string.required(message?: string | function): Schema`

The same as the `mixed()` schema required, **except** that empty strings are also considered 'missing' values.

#### `string.length(limit: number | Ref, message?: string | function): Schema`

Set a required length for the string value. The `${length}` interpolation can be used in the `message` argument

#### `string.min(limit: number | Ref, message?: string | function): Schema`

Set a minimum length limit for the string value. The `${min}` interpolation can be used in the `message` argument

#### `string.max(limit: number | Ref, message?: string | function): Schema`

Set a maximum length limit for the string value. The `${max}` interpolation can be used in the `message` argument

#### `string.matches(regex: Regex, message?: string | function): Schema`

Provide an arbitrary `regex` to match the value against.

```js
let schema = string().matches(/(hi|bye)/);

await schema.isValid('hi'); // => true
await schema.isValid('nope'); // => false
```

#### `string.matches(regex: Regex, options: { message: string, excludeEmptyString: bool }): Schema`

An alternate signature for `string.matches` with an options object. `excludeEmptyString`, when true,
short circuits the regex test when the value is an empty string

```js
let schema = string().matches(/(hi|bye)/, { excludeEmptyString: true });

await schema.isValid(''); // => true
```

#### `string.email(message?: string | function): Schema`

Validates the value as an email address via a regex.

#### `string.url(message?: string | function): Schema`

Validates the value as a valid URL via a regex.

#### `string.uuid(message?: string | function): Schema`

Validates the value as a valid UUID via a regex.

#### `string.ensure(): Schema`

Transforms `undefined` and `null` values to an empty string along with
setting the `default` to an empty string.

#### `string.trim(message?: string | function): Schema`

Transforms string values by removing leading and trailing whitespace. If
`strict()` is set it will only validate that the value is trimmed.

#### `string.lowercase(message?: string | function): Schema`

Transforms the string value to lowercase. If `strict()` is set it
will only validate that the value is lowercase.

#### `string.uppercase(message?: string | function): Schema`

Transforms the string value to uppercase. If `strict()` is set it
will only validate that the value is uppercase.

### number

Define a number schema. Supports all the same methods as [`mixed`](#mixed).

```js
let schema = yup.number();

await schema.isValid(10); // => true
```

The default `cast` logic of `number` is: [`parseFloat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat).

Failed casts return `NaN`.

#### `number.min(limit: number | Ref, message?: string | function): Schema`

Set the minimum value allowed. The `${min}` interpolation can be used in the
`message` argument.

#### `number.max(limit: number | Ref, message?: string | function): Schema`

Set the maximum value allowed. The `${max}` interpolation can be used in the
`message` argument.

#### `number.lessThan(max: number | Ref, message?: string | function): Schema`

Value must be less than `max`. The `${less}` interpolation can be used in the
`message` argument.

#### `number.moreThan(min: number | Ref, message?: string | function): Schema`

Value must be strictly greater than `min`. The `${more}` interpolation can be used in the
`message` argument.

#### `number.positive(message?: string | function): Schema`

Value must be a positive number.

#### `number.negative(message?: string | function): Schema`

Value must be a negative number.

#### `number.integer(message?: string | function): Schema`

Validates that a number is an integer.

#### `number.truncate(): Schema`

Transformation that coerces the value to an integer by stripping off the digits
to the right of the decimal point.

#### `number.round(type: 'floor' | 'ceil' | 'trunc' | 'round' = 'round'): Schema`

Adjusts the value via the specified method of `Math` (defaults to 'round').

### boolean

Define a boolean schema. Supports all the same methods as [`mixed`](#mixed).

```js
let schema = yup.boolean();

await schema.isValid(true); // => true
```

### date

Define a Date schema. By default ISO date strings will parse correctly,
for more robust parsing options see the extending schema types at the end of the readme.
Supports all the same methods as [`mixed`](#mixed).

```js
let schema = yup.date();

await schema.isValid(new Date()); // => true
```

The default `cast` logic of `date` is pass the value to the `Date` constructor, failing that, it will attempt
to parse the date as an ISO date string.

Failed casts return an invalid Date.

#### `date.min(limit: Date | string | Ref, message?: string | function): Schema`

Set the minimum date allowed. When a string is provided it will attempt to cast to a date first
and use the result as the limit.

#### `date.max(limit: Date | string | Ref, message?: string | function): Schema`

Set the maximum date allowed, When a string is provided it will attempt to cast to a date first
and use the result as the limit.

### array

Define an array schema. Arrays can be typed or not, When specifying the element type, `cast` and `isValid`
will apply to the elements as well. Options passed into `isValid` are passed also passed to child schemas.
Supports all the same methods as [`mixed`](#mixed).

```js
let schema = yup.array().of(yup.number().min(2));

await schema.isValid([2, 3]); // => true
await schema.isValid([1, -24]); // => false

schema.cast(['2', '3']); // => [2, 3]
```

You can also pass a subtype schema to the array constructor as a convenience.

```js
array().of(yup.number());
// or
array(yup.number());
```

The default `cast` behavior for `array` is: [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)

Failed casts return: `null`;

#### `array.of(type: Schema): Schema`

Specify the schema of array elements. `of()` is optional and when omitted the array schema will
not validate its contents.

#### `array.length(length: number | Ref, message?: string | function): Schema`

Set a specific length requirement for the array. The `${length}` interpolation can be used in the `message` argument.

#### `array.min(limit: number | Ref, message?: string | function): Schema`

Set a minimum length limit for the array. The `${min}` interpolation can be used in the `message` argument.

#### `array.max(limit: number | Ref, message?: string | function): Schema`

Set a maximum length limit for the array. The `${max}` interpolation can be used in the `message` argument.

#### `array.ensure(): Schema`

Ensures that the value is an array, by setting the default to `[]` and transforming `null` and `undefined`
values to an empty array as well. Any non-empty, non-array value will be wrapped in an array.

```js
array().ensure().cast(null); // => []
array().ensure().cast(1); // => [1]
array().ensure().cast([1]); // => [1]
```

#### `array.compact(rejector: (value) => boolean): Schema`

Removes falsey values from the array. Providing a rejecter function lets you specify the rejection criteria yourself.

```js
array().compact().cast(['', 1, 0, 4, false, null]); // => [1, 4]

array()
  .compact(function (v) {
    return v == null;
  })
  .cast(['', 1, 0, 4, false, null]); // => ['', 1, 0, 4, false]
```

### object

Define an object schema. Options passed into `isValid` are also passed to child schemas.
Supports all the same methods as [`mixed`](#mixed).

```js
yup.object().shape({
  name: string().required(),
  age: number().required().positive().integer(),
  email: string().email(),
  website: string().url(),
});
```

You can also pass a shape to the object constructor as a convenience.

```js
object().shape({
  num: number(),
});
// or
object({
  num: number(),
});
```

The default `cast` behavior for `object` is: [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)

Failed casts return: `null`;

#### Object schema defaults

Object schema come with a default value already set, which "builds" out the object shape, a
sets any defaults for fields:

```js
const schema = object({
  name: string().default(''),
});

schema.default(); // -> { name: '' }
```

This may be a bit suprising, but is generally very helpful since it allows large, nested
schema to create default values that fill out the whole shape and not just the root object. There is
one gotcha! though. For nested object schema that are optional but include non optional fields
may fail in unexpected ways:

```js
const schema = object({
  id: string().required(),
  names: object({
    first: string().required(),
  }),
});

schema.isValid({ id: 1 }); // false! names.first is required
```

This is because yup casts the input object before running validation
which will produce:

> `{ id: '1', names: { first: undefined }}`

During the validation phase `names` exists, and is validated, finding `names.first` missing.
If you wish to avoid this behavior do one of the following:

- Set the nested default to undefined: `names.default(undefined)`
- mark it nullable and default to null: `names.nullable().default(null)`

#### `object.shape(fields: object, noSortEdges?: Array<[string, string]>): Schema`

Define the keys of the object and the schemas for said keys.

Note that you can chain `shape` method, which acts like object extends, for example:

```js
object({
  a: string(),
  b: number(),
}).shape({
  b: string(),
  c: number(),
});
```

would be exactly the same as:

```js
object({
  a: string(),
  b: string(),
  c: number(),
});
```

#### `object.concat(schemaB: ObjectSchema): ObjectSchema`

Creates a object schema, by applying all settings and fields from `schemaB` to the base, producing a new schema.
The object shape is shallowly merged with common fields from `schemaB` taking precedence over the base
fields.

#### `object.pick(keys: string[]): Schema`

Create a new schema from a subset of the original's fields.

```js
const person = object({
  age: number().default(30).required(),
  name: string().default('pat').required(),
  color: string().default('red').required(),
});

const nameAndAge = person.pick(['name', 'age']);
nameAndAge.getDefault(); // => { age: 30, name: 'pat'}
```

#### `object.omit(keys: string[]): Schema`

Create a new schema with fields omitted.

```js
const person = object({
  age: number().default(30).required(),
  name: string().default('pat').required(),
  color: string().default('red').required(),
});

const nameAndAge = person.omit(['color']);
nameAndAge.getDefault(); // => { age: 30, name: 'pat'}
```

#### `object.getDefaultFromShape(): Record<string, unknown>`

Produces a default object value by walking the object shape and calling `default()`
on each field. This is the default behavior of `getDefault()` but allows for
building out an object skeleton regardless of the default().

#### `object.from(fromKey: string, toKey: string, alias: boolean = false): this`

Transforms the specified key to a new key. If `alias` is `true` then the old key will be left.

```js
let schema = object({
  myProp: mixed(),
  Other: mixed(),
})
  .from('prop', 'myProp')
  .from('other', 'Other', true);

schema.cast({ prop: 5, other: 6 }); // => { myProp: 5, other: 6, Other: 6 }
```

#### `object.noUnknown(onlyKnownKeys: boolean = true, message?: string | function): Schema`

Validate that the object value only contains keys specified in `shape`, pass `false` as the first
argument to disable the check. Restricting keys to known, also enables `stripUnknown` option, when not in strict mode.

#### `object.camelCase(): Schema`

Transforms all object keys to camelCase

#### `object.constantCase(): Schema`

Transforms all object keys to CONSTANT_CASE.
