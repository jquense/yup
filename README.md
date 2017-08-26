
Yup
=======================

Yup is a JavaScript object schema validator and object parser. The API and style is ~~stolen~~ heavily inspired
by [Joi](https://github.com/hapijs/joi), which is an amazing library but is generally too large and difficult
to package for use in a browser. Yup is a leaner in the same spirit without some of the fancy features.
You can use it on the server as well, but in that case you might as well just use Joi.

Yup is also a good bit less opinionated than joi, allowing for custom transformations and async validation.
It also allows "stacking" conditions via `when` for properties that depend on more than one other sibling or
child property. Yup separates the parsing and validating functions into separate steps so it can be used to parse
json separate from validating it, via the `cast` method.

**Try it out:** https://runkit.com/jquense/yup#

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Install](#install)
- [Usage](#usage)
  - [Using a custom locale dictionary](#using-a-custom-locale-dictionary)
- [API](#api)
  - [`yup`](#yup)
    - [`yup.reach(schema: Schema, path: string, value: ?object, context: ?object): Schema`](#yupreachschema-schema-path-string-value-object-context-object-schema)
    - [`yup.addMethod(schemaType: Schema, name: string, method: ()=> Schema): void`](#yupaddmethodschematype-schema-name-string-method--schema-void)
    - [`yup.ref(path: string, options: { contextPrefix: string }): Ref`](#yuprefpath-string-options--contextprefix-string--ref)
    - [`yup.lazy((value: any) => Schema): Lazy`](#yuplazyvalue-any--schema-lazy)
    - [`ValidationError(errors: string | Array<string>, value: any, path: string)`](#validationerrorerrors-string--arraystring-value-any-path-string)
  - [mixed](#mixed)
    - [`mixed.clone(): Schema`](#mixedclone-schema)
    - [`mixed.label(label: string): Schema`](#mixedlabellabel-string-schema)
    - [`mixed.meta(metadata: object): Schema`](#mixedmetametadata-object-schema)
    - [`mixed.describe(): SchemaDescription`](#mixeddescribe-schemadescription)
    - [`mixed.concat(schema: Schema)`](#mixedconcatschema-schema)
    - [`mixed.validate(value: any, options: ?object, callback: ?function): Promise<any, ValidationError>`](#mixedvalidatevalue-any-options-object-callback-function-promiseany-validationerror)
    - [`mixed.isValid(value: any, options: ?object, callback: ?function): Promise<boolean>`](#mixedisvalidvalue-any-options-object-callback-function-promiseboolean)
    - [`mixed.cast(value: any): any`](#mixedcastvalue-any-any)
    - [`mixed.isType(value: any): boolean`](#mixedistypevalue-any-boolean)
    - [`mixed.strict(isStrict: boolean = false): Schema`](#mixedstrictisstrict-boolean--false-schema)
    - [`mixed.strip(stripField: boolean = true): Schema`](#mixedstripstripfield-boolean--true-schema)
    - [`mixed.withMutation(builder: (current: Schema) => void): void`](#mixedwithmutationbuilder-current-schema--void-void)
    - [`mixed.default(value: any): Schema`](#mixeddefaultvalue-any-schema)
    - [`mixed.default(): Any`](#mixeddefault-any)
    - [`mixed.nullable(isNullable: boolean = false): Schema`](#mixednullableisnullable-boolean--false-schema)
    - [`mixed.required(message: ?string): Schema`](#mixedrequiredmessage-string-schema)
    - [`mixed.typeError(message: string): Schema`](#mixedtypeerrormessage-string-schema)
    - [`mixed.oneOf(arrayOfValues: Array<any>, string: ?message): Schema` Alias: `equals`](#mixedoneofarrayofvalues-arrayany-string-message-schema-alias-equals)
    - [`mixed.notOneOf(arrayOfValues: Array<any>, string: ?message)`](#mixednotoneofarrayofvalues-arrayany-string-message)
    - [`mixed.when(keys: string | Array<string>, builder: object | (value, schema)=> Schema): Schema`](#mixedwhenkeys-string--arraystring-builder-object--value-schema-schema-schema)
    - [`mixed.test(name: string, message: string, test: function, callbackStyleAsync: ?boolean): Schema`](#mixedtestname-string-message-string-test-function-callbackstyleasync-boolean-schema)
    - [`mixed.test(options: object): Schema`](#mixedtestoptions-object-schema)
    - [`mixed.transform((currentValue: any, originalValue: any) => any): Schema`](#mixedtransformcurrentvalue-any-originalvalue-any--any-schema)
  - [string](#string)
    - [`string.required(message: ?string): Schema`](#stringrequiredmessage-string-schema)
    - [`string.min(limit: number | Ref, message: ?string): Schema`](#stringminlimit-number--ref-message-string-schema)
    - [`string.max(limit: number | Ref, message: ?string): Schema`](#stringmaxlimit-number--ref-message-string-schema)
    - [`string.matches(regex: Regex, message: ?string): Schema`](#stringmatchesregex-regex-message-string-schema)
    - [`string.matches(regex: Regex, options: { message: string, excludeEmptyString: bool }): Schema`](#stringmatchesregex-regex-options--message-string-excludeemptystring-bool--schema)
    - [`string.email(message: ?string): Schema`](#stringemailmessage-string-schema)
    - [`string.url(message: ?string): Schema`](#stringurlmessage-string-schema)
    - [`string.ensure(): Schema`](#stringensure-schema)
    - [`string.trim(message: ?string): Schema`](#stringtrimmessage-string-schema)
    - [`string.lowercase(message: ?string): Schema`](#stringlowercasemessage-string-schema)
    - [`string.uppercase(message: ?string): Schema`](#stringuppercasemessage-string-schema)
  - [number](#number)
    - [`number.min(limit: number | Ref, message: ?string): Schema`](#numberminlimit-number--ref-message-string-schema)
    - [`number.max(limit: number | Ref, message: ?string): Schema`](#numbermaxlimit-number--ref-message-string-schema)
    - [`number.positive(message: ?string): Schema`](#numberpositivemessage-string-schema)
    - [`number.negative(message: ?string): Schema`](#numbernegativemessage-string-schema)
    - [`number.integer(message: ?string): Schema`](#numberintegermessage-string-schema)
    - [`number.truncate(): Schema`](#numbertruncate-schema)
    - [`number.round(type: 'floor' | 'ceil' | 'trunc' | 'round' = 'round'): Schema`](#numberroundtype-floor--ceil--trunc--round--round-schema)
  - [boolean](#boolean)
  - [date](#date)
    - [`date.min(limit: Date | string | Ref, message: ?string): Schema`](#dateminlimit-date--string--ref-message-string-schema)
    - [`date.max(limit: Date | string | Ref, message: ?string): Schema`](#datemaxlimit-date--string--ref-message-string-schema)
  - [array](#array)
    - [`array.of(type: Schema): Schema`](#arrayoftype-schema-schema)
    - [`array.required(message: ?string): Schema`](#arrayrequiredmessage-string-schema)
    - [`array.min(limit: number | Ref, message: ?string): Schema`](#arrayminlimit-number--ref-message-string-schema)
    - [`array.max(limit: number | Ref, message: ?string): Schema`](#arraymaxlimit-number--ref-message-string-schema)
    - [`array.ensure(): Schema`](#arrayensure-schema)
    - [`array.compact(rejector: (value) => boolean): Schema`](#arraycompactrejector-value--boolean-schema)
  - [object](#object)
    - [`object.shape(fields: object, noSortEdges: ?Array<[string, string]>): Schema`](#objectshapefields-object-nosortedges-arraystring-string-schema)
    - [`object.from(fromKey: string, toKey: string, alias: boolean = false): Schema`](#objectfromfromkey-string-tokey-string-alias-boolean--false-schema)
    - [`object.noUnknown(onlyKnownKeys: boolean = true, message: ?string): Schema`](#objectnounknownonlyknownkeys-boolean--true-message-string-schema)
    - [`object.camelCase(): Schema`](#objectcamelcase-schema)
    - [`object.constantCase(): Schema`](#objectconstantcase-schema)
- [Extending Schema Types](#extending-schema-types)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

```sh
npm install -S yup
```

Yup always relies on the `Promise` global object to handle asynchronous values as well `Set`.
For browsers that do not support these, you'll need to include a polyfill, such as core-js:

```js
import 'core-js/es6/promise';
import 'core-js/es6/set';
```

## Usage

You define and create schema objects. Schema objects are immutable, so each call of a method returns a _new_ schema object.

__try it out using tonicdev! https://tonicdev.com/570c52590a85f71200eb09ba/yup__

```js
var yup = require('yup')

var schema = yup.object().shape({
  name:      yup.string().required(),
  age:       yup.number().required().positive().integer(),
  email:     yup.string().email(),
  website:   yup.string().url(),
  createdOn: yup.date().default(function() {
    return new Date
  })
})

//check validity
schema.isValid({
  name: 'jimmy',
  age: 24
})
.then(function(valid){
  valid // => true
})


//you can try and type cast objects to the defined schema
schema.cast({
  name: 'jimmy',
  age: '24',
  createdOn: '2014-09-23T19:25:25Z'
})
// => { name: 'jimmy', age: 24, createdOn: Date }
```

### Using a custom locale dictionary
Allows you to customize the default messages used by Yup, when no message is provided with a validation test.
If any message is missing in the custom dictionary the error message will default to Yup's one.
```js
import { setLocale } from 'yup/lib/customLocale'

setLocale({
  mixed: {
    default: 'Não é válido',
  },
  number: {
    max: 'Deve ser maior que ${min}',
  },
})

// Now use Yup schemas AFTER you defined your custom dicionary
const schema = yup.object().shape({
  name: yup.string(),
  age: yup.number().min(18),
})
schema.validate({ name: 'jimmy', age: 'hi' })
  .catch(function(err){
    err.name   // 'ValidationError'
    err.errors // => ['Deve ser maior que 18']
  })
```

## API

### `yup`

The module export.

```js
var yup = require('yup')

yup.mixed
yup.string
yup.number
yup.boolean // also aliased as yup.bool
yup.date
yup.object
yup.array

yup.reach
yup.addMethod
yup.ValidationError
```

#### `yup.reach(schema: Schema, path: string, value: ?object, context: ?object): Schema`

For nested schema's `yup.reach` will retrieve a nested schema based on the provided path.

For nested schema that need to resolve dynamically, you can provide a `value` and optionally
a `context` object.

```js
var schema = object().shape({
      nested: object()
        .shape({
          arr: array().of(
            object().shape({ num: number().max(4) }))
      })
    })

reach(schema, 'nested.arr.num')
reach(schema, 'nested.arr[].num')
reach(schema, 'nested.arr[1].num')
reach(schema, 'nested["arr"][1].num')
```

#### `yup.addMethod(schemaType: Schema, name: string, method: ()=> Schema): void`

Adds a new method to the core schema types. A friendlier convenience method for `schemaType.prototype[name] = method`.

```js
  yup.addMethod(yup.date, 'format', function(formats, parseStrict) {

    return this.transform(function(value, originalValue){

      if ( this.isType(value) ) return value

      value = Moment(originalValue, formats, parseStrict)

      return date.isValid() ? date.toDate() : invalidDate
    })
  })
```

#### `yup.ref(path: string, options: { contextPrefix: string }): Ref`

Creates a reference to another sibling or sibling descendant field. Ref's are resolved
at _validation/cast time_ and supported where specified. Ref's are evaluated in in the proper order so that
the ref value is resolved before the field using the ref (be careful of circular dependencies!).

```js
var schema = object({
  baz: ref('foo.bar'),
  foo: object({
    bar: string()
  })
  x: ref('$x')
})

inst.cast({ foo: { bar: 'boom' } }, { context: { x: 5 } })
// { baz: 'boom',  x: 5, { foo: { bar: 'boom' } }, }
```

#### `yup.lazy((value: any) => Schema): Lazy`

creates a schema that is evaluated at validation/cast time. Useful for creating
recursive schema like Trees, for polymophic fields and arrays.

__CAUTION!__ When defining parent-child recursive object schema, you want to reset the `default()`
to `undefined` on the child otherwise the object will infinitely nest itself when you cast it!.

```js
var node = object({
  id: number(),
  child: yup.lazy(() =>
    node.default(undefined)
  )
})

let renderable = yup.lazy(value => {
  switch (typeof value) {
    case 'number':
      return number()
    case 'string':
      return string()
    default:
      return mixed()
  }
})

let renderables = array().of(renderable)
```

#### `ValidationError(errors: string | Array<string>, value: any, path: string)`

Thrown on failed validations, with the following properties
 - `name`: "ValidationError"
 - `path`: a string, indicating where there error was thrown. `path` is empty at the root level.
 - `errors`: array of error messages
 - `inner`: in the case of aggregate errors, inner is an array of `ValidationErrors` throw earlier in the
 validation chain. When the `abortEarly` option is `false` this is where you can inspect each error thrown,
 alternatively `errors` will have all the of the messages from each inner error.

### mixed

Creates a schema that matches all types. All types inherit from this base type

```javascript
var schema = yup.mixed();
schema.isValid(undefined, function(valid){
  valid //=> true
})
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
  tests: Array<string>
}
```

#### `mixed.concat(schema: Schema)`

Creates a new instance of the schema by combining two schemas. Only schemas of the same type can be concatenated.

#### `mixed.validate(value: any, options: ?object, callback: ?function): Promise<any, ValidationError>`

Returns the value (a cast value if `isStrict` is `false`) if the value is valid, and returns the errors otherwise.
This method is __asynchronous__ and returns a Promise object, that is fulfilled with the value, or rejected
with a `ValidationError`. If you are more comfortable with Node style callbacks, then you can provide one
to be called when the validation is complete (called with the Error as the first argument, and value
as the second).


The `options` argument is an object hash containing any schema options you may want to override
(or specify for the first time).

```js
Options = {
  strict: boolean = false;
  abortEarly: boolean = true;
  stripUnknown: boolean = false;
  recursive: boolean = true;
  context: ?object;
}
```
- `strict`: only validate the input, and skip and coercion or transformation
- `abortEarly`: return from validation methods on the first error rather
than after all validations run.
- `stripUnknown`: remove unspecified keys from objects.
- `recursive`: when `false` validations will not descend into nested schema
(relevant for objects or arrays).
- `context`: any context needed for validating schema conditions (see: `when()`)

```js
schema.validate({ name: 'jimmy',age: 24 })
  .then(function(value){
    value // => { name: 'jimmy',age: 24 }
  })

schema.validate({ name: 'jimmy', age: 'hi' })
  .catch(function(err){
    err.name   // 'ValidationError'
    err.errors // => ['age must be a number']
  })

//or with callbacks
schema.validate({ name: 'jimmy',age: 24 }, function(err, value){
  err === null // true
  value        // => { name: 'jimmy',age: 24 }
})

schema.validate({ name: 'jimmy', age: 'hi' }, function(err, value){
  err.name   // 'ValidationError'
  err.errors // => ['age must be a number']
  value === undefined // true
})
```

#### `mixed.isValid(value: any, options: ?object, callback: ?function): Promise<boolean>`

Returns `true` when the passed in value matches the schema. `isValid`
is __asynchronous__ and returns a Promise object. If you are more comfortable with Node style callbacks,
providing a function as the last argument will opt into that interface.

Takes the same options as `validate()`.

#### `mixed.cast(value: any): any`

Attempts to coerce the passed in value to a value that matches the schema. For example: `'5'` will
cast to `5` when using the `number()` type. Failed casts generally return `null`, but may also
return results like `NaN` and unexpected strings.

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
  notThis: string().strip()
})

schema.cast({ notThis: 'foo', useThis: 4 }) // { useThis: 4 }
```

#### `mixed.withMutation(builder: (current: Schema) => void): void`

First the legally required Rich Hickey quote:

> If a tree falls in the woods, does it make a sound?
>
> If a pure function mutates some local data in order to produce an immutable return value, is that ok?

`withMutation` allows you to mutate the schema in place, instead of the default behavior which clones before each change.
Generally this isn't necessary since the vast majority of schema changes happen during the initial
declaration, and only happen once over the lifetime of the schema, so performance isn't an issue.
However certain mutations _do_ occur at cast/validation time, (such as conditional schema using `when()`), or
when instantiating a schema object.

```js
object()
  .shape({ key: string() })
  .withMutation(schema => {
    return arrayOfObjectTests.forEach(test => {
      schema.test(test)
    })
  })
```

#### `mixed.default(value: any): Schema`

Sets a default value to use when the value is `undefined`.
Defaults are created after transformations are executed, but before validations, to help ensure that safe
defaults are specified. The default value will be cloned on each use, which can incur performance penalty
for objects and arrays. To avoid this overhead you can also pass a function that returns an new default.
Note that `null` is considered a separate non-empty value.

```js
  yup.string.default('nothing');

  yup.object.default({ number: 5}); // object will be cloned every time a default is needed

  yup.object.default(() => ({ number: 5})); // this is cheaper

  yup.date.default(() => new Date()); //also helpful for defaults that change over time

```

#### `mixed.default(): Any`

Calling `default` with no arguments will return the current default value


#### `mixed.nullable(isNullable: boolean = false): Schema`

Indicates that `null` is a valid value for the schema. Without `nullable()`
`null` is treated as a different type and will fail `isType()` checks.

#### `mixed.required(message: ?string): Schema`

Mark the schema as required. All field values apart from `undefined` meet this requirement.

#### `mixed.typeError(message: string): Schema`

Define an error message for failed type checks. The `${value}` and `${type}` interpolation can
be used in the `message` argument.

#### `mixed.oneOf(arrayOfValues: Array<any>, string: ?message): Schema` Alias: `equals`

Whitelist a set of values. Values added are automatically removed from any blacklist if they are in it.
The `${values}` interpolation can be used in the `message` argument.

```javascript
var schema = yup.mixed().oneOf(['jimmy', 42]);
schema.isValid(42)       //=> true
schema.isValid('jimmy')  //=> true
schema.isValid(new Date) //=> false
```

#### `mixed.notOneOf(arrayOfValues: Array<any>, string: ?message)`

Blacklist a set of values. Values added are automatically removed from any whitelist if they are in it.
The `${values}` interpolation can be used in the `message` argument.

```javascript
var schema = yup.mixed().notOneOf(['jimmy', 42]);
schema.isValid(42)       //=> false
schema.isValid(new Date) //=> true
```

#### `mixed.when(keys: string | Array<string>, builder: object | (value, schema)=> Schema): Schema`

Adjust the schema based on a sibling or sibling children fields. You can provide an object
literal where the key `is` is value or a matcher function, `then` provides the true schema and/or
`otherwise` for the failure condition.

`is` conditions are strictly compared (`===`) if you want to use a different form of equality you
can provide a function like: `is: (value) => value == true`.

Like joi you can also prefix properties with `$` to specify a property that is dependent
on `context` passed in by `validate()` or `isValid`. `when` conditions are additive.

```javascript
var inst = yup.object({
      isBig: yup.boolean(),
      count: yup.number()
        .when('isBig', {
          is: true,  // alternatively: (val) => val == true
          then:      yup.number().min(5),
          otherwise: yup.number().min(0)
        })
        .when('$other', (other, schema) => other === 4
          ? schema.max(6)
          : schema)
    })

inst.validate(value, { context: { other: 4 }})
```

You can also specify more than one dependent key, in which case each value will be spread as an argument.

```javascript
var inst = yup.object({
      isSpecial: yup.bool()
      isBig: yup.bool(),
      count: yup.number()
        .when(['isBig', 'isSpecial'], {
          is: true,  // alternatively: (isBig, isSpecial) => isBig && isSpecial
          then:      yup.number().min(5),
          otherwise: yup.number().min(0)
        })
    })

inst.validate({
  isBig: true,
  isSpecial: true,
  count: 10
})
```

Alternatively you can provide a function the returns a schema
(called with the value of the key and the current schema).

```js
var inst = yup.object({
      isBig: yup.boolean(),
      count: yup.number()
        .when('isBig', (isBig, schema) => {
          return isBig ? schema.min(5) : schema.min(0)
        })
    })

inst.validate({ isBig: false, count: 4 })
```


#### `mixed.test(name: string, message: string, test: function, callbackStyleAsync: ?boolean): Schema`

Adds a test function to the validation chain. Tests are run after any object is cast.
Many types have some tests built in, but you can create custom ones easily.
In order to allow asynchronous custom validations _all_ tests are run asynchronously.
A consequence of this is that test execution order cannot be guaranteed.

All tests must provide a `name`, an error `message` and a validation function that must return
`true` or `false` or a `ValidationError`. To make a test async return a promise that resolves `true`
or `false` or a `ValidationError`. If you prefer the Node callback style, you can pass `true` for `callbackStyleAsync`
and the validation function will pass in an additional `done` function as the last parameter to
 be called with the validity.

for the `message` argument you can provide a string which is will interpolate certain values
if specified using the `${param}` syntax. By default all test messages are passed a `path` value
which is valuable in nested schemas.

the `test` function is called with the current `value`. For more advanced validations you can
use the alternate signature to provide more options (see below):

```js
var jimmySchema = yup.string()
  .test('is-jimmy', '${path} is not Jimmy', value => value === 'jimmy');

// or make it async by returning a promise
var asyncJimmySchema = yup.string()
  .test('is-jimmy', '${path} is not Jimmy', function (value){
    return fetch('/is-jimmy/' + value)
      .then(response => response.responseText === 'true')
  });

schema.isValid('jimmy').then(...) //=> true

schema.isValid('john').then(...) //=> false
schema.errors // => [ 'this is not Jimmy!']

```

test functions are called with a special context, or `this` value, that exposes some useful metadata and functions.

- `this.path`: the string path of the current validation
- `this.schema`: the resolved schema object that the test is running against.
- `this.options`: the `options` object that validate() or isValid() was called with
- `this.parent`:  in the case of nested schema, this is the value of the parent object
- `this.createError(Object: { path: String, message: String })`: create and return a
validation error. Useful for dynamically setting the `path`, or more likely, the error `message`.
If either option is omitted it will use the current path, or default message.


#### `mixed.test(options: object): Schema`

Alternative `test(..)` signature. `options` is an object containing some of the following options:

```js
Options = {
  // Unique name identifying the test
  name: string;
  // test function, determines schema validity
  test: (value: any) => boolean;
  // The validation error message
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

```javascript
var schema = yup.mixed().test({
      name: 'max',
      exclusive: true,
      params: { max },
      message: '${path} must be less than ${max} characters',
      test: value => value == null || value.length <= max
    });
```

#### `mixed.transform((currentValue: any, originalValue: any) => any): Schema`

Adds a transformation to the transform chain. Transformations are central to the casting process,
default transforms for each type coerce values to the specific type (as verified by [`isType()`](mixedistypevalue)).
transforms are run before validations and only applied when `strict` is `true`. Some types have built in transformations.

Transformations are useful for arbitrarily altering how the object is cast, __however, you should take care
not to mutate the passed in value.__ Transforms are run sequentially so each `value` represents the
current state of the cast, you can use the `originalValue` param if you need to work on the raw initial value.

```javascript
var schema = yup.string().transform(function(currentValue, originalvalue){
  return this.isType(value) && value !== null
    ? value.toUpperCase()
    : value
});

schema.cast('jimmy') //=> 'JIMMY'
```

Each types will handle basic coercion of values to the proper type for you, but occasionally
you may want to adjust or refine the default behavior. For example, if you wanted to use a different
date parsing strategy than the default one you could do that with a transform.

```js
yup.date().transform(function(formats = 'MMM dd, yyyy'){
  //check to see if the previous transform already parsed the date
  if ( this.isType(value) ) return value

  //the default coercion failed so lets try it with Moment.js instead
  value = Moment(originalValue, formats)

  //if its valid return the date object, otherwise return an `InvalidDate`
  return date.isValid() ? date.toDate() : new Date('')
})
```

### string

Define a string schema. Supports all the same methods as [`mixed`](#mixed).

```javascript
var schema = yup.string();
schema.isValid('hello') //=> true
```

By default, the `cast` logic of `string` is to call `toString` on the value if it exists.
empty values are not coerced (use `ensure()` to coerce empty values to empty strings).

Failed casts return the input value.

#### `string.required(message: ?string): Schema`

The same as the `mixed()` schema required, except that empty strings are also considered 'missing' values.
To allow empty strings but fail on `undefined` values use: `string().required().min(0)`

#### `string.min(limit: number | Ref, message: ?string): Schema`

Set an minimum length limit for the string value. The `${min}` interpolation can be used in the `message` argument

#### `string.max(limit: number | Ref, message: ?string): Schema`

Set an maximum length limit for the string value. The `${max}` interpolation can be used in the `message` argument

#### `string.matches(regex: Regex, message: ?string): Schema`

Provide an arbitrary `regex` to match the value against.

```javascript
var v = string().matches(/(hi|bye)/);
v.isValid('hi').should.eventually().equal(true)
v.isValid('nope').should.eventually().equal(false)
```

#### `string.matches(regex: Regex, options: { message: string, excludeEmptyString: bool }): Schema`

An alternate signature for `string.matches` with an options object. `excludeEmptyString`, when true,
short circuits the regex test when the value is an empty string

```javascript
var v = string().matches(/(hi|bye)/, { excludeEmptyString: true });
v.isValid('').should.eventually().equal(false)
```

#### `string.email(message: ?string): Schema`

Validates the value as an email address via a regex.

#### `string.url(message: ?string): Schema`

Validates the value as a valid URL via a regex.

#### `string.ensure(): Schema`

Transforms `undefined` and `null` values to an empty string along with
setting the `default` to an empty string.

#### `string.trim(message: ?string): Schema`

Transforms string values by removing leading and trailing whitespace. If
`strict()` is set it will only validate that the value is trimmed.

#### `string.lowercase(message: ?string): Schema`

Transforms the string value to lowercase. If `strict()` is set it
will only validate that the value is lowercase.

#### `string.uppercase(message: ?string): Schema`

Transforms the string value to uppercase. If `strict()` is set it
will only validate that the value is uppercase.

### number

Define a number schema. Supports all the same methods as [`mixed`](#mixed).

```javascript
var schema = yup.number();
schema.isValid(10) //=> true
```

The default `cast` logic of `number` is: [`parseFloat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat).

Failed casts return `NaN`.

#### `number.min(limit: number | Ref, message: ?string): Schema`

Set the minimum value allowed. The `${min}` interpolation can be used in the
`message` argument.

#### `number.max(limit: number | Ref, message: ?string): Schema`

Set the maximum value allowed. The `${max}` interpolation can be used in the
`message` argument.

#### `number.positive(message: ?string): Schema`

Value must be a positive number.

#### `number.negative(message: ?string): Schema`

Value must be a negative number.

#### `number.integer(message: ?string): Schema`

Validates that a number is an integer.

#### `number.truncate(): Schema`

Transformation that coerces the value to an integer by stripping off the digits
to the right of the decimal point.

#### `number.round(type: 'floor' | 'ceil' | 'trunc' | 'round' = 'round'): Schema`

Adjusts the value via the specified method of `Math` (defaults to 'round').

### boolean

Define a boolean schema. Supports all the same methods as [`mixed`](#mixed).

```javascript
var schema = yup.boolean();
schema.isValid(true) //=> true
```

### date

Define a Date schema. By default ISO date strings will parse correctly,
for more robust parsing options see the extending schema types at the end of the readme.
Supports all the same methods as [`mixed`](#mixed).

```javascript
var schema = yup.date();
schema.isValid(new Date) //=> true
```

The default `cast` logic of `date` is pass the value to the `Date` constructor, failing that, it will attempt
to parse the date as an ISO date string.

Failed casts return an invalid Date.


#### `date.min(limit: Date | string | Ref, message: ?string): Schema`

Set the minimum date allowed. When a string is provided it will attempt to cast to a date first
and use the result as the limit.

#### `date.max(limit: Date | string | Ref, message: ?string): Schema`

Set the maximum date allowed, When a string is provided it will attempt to cast to a date first
and use the result as the limit.

### array

Define an array schema. Arrays can be typed or not, When specifying the element type, `cast` and `isValid`
will apply to the elements as well. Options passed into `isValid` are passed also passed to child schemas.
Supports all the same methods as [`mixed`](#mixed).

```javascript
var schema = yup.array().of(number().min(2));
schema.isValid([2, 3])   //=> true
schema.isValid([1, -24]) //=> false

schema.cast(['2', '3'])  //=> [2, 3]
```

You can also pass a subtype schema to the array constructor as a convenience.

```js
array().of(number())
//or
array(number())
```

The default `cast` behavior for `array` is: [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)

Failed casts return: `null`;

#### `array.of(type: Schema): Schema`

Specify the schema of array elements. `of()` is optional and when omitted the array schema will
not validate its contents.

#### `array.required(message: ?string): Schema`

The same as the `mixed()` schema required, except that empty arrays are also considered 'missing' values.
To allow empty arrays but fail on `undefined` values use: `array().required().min(0)`

#### `array.min(limit: number | Ref, message: ?string): Schema`

Set an minimum length limit for the array. The `${min}` interpolation can be used in the `message` argument.

#### `array.max(limit: number | Ref, message: ?string): Schema`

Set an maximum length limit for the array. The `${max}` interpolation can be used in the `message` argument.

#### `array.ensure(): Schema`

Ensures that the value is an array, by setting the default to `[]` and transforming `null` and `undefined`
values to an empty array as well. Any non-empty, non-array value will be wrapped in an array.

```js
array().ensure().cast(null) // -> []
array().ensure().cast(1) // -> [1]
array().ensure().cast([1]) // -> [1]
```

#### `array.compact(rejector: (value) => boolean): Schema`

Removes falsey values from the array. Providing a rejecter function lets you specify the rejection criteria yourself.

```javascript
array()
  .compact()
  .cast(['', 1, 0, 4, false, null]) // => [1,4]

array()
  .compact(function(v){
    return v == null
  })
  .cast(['', 1, 0, 4, false, null]) // => ['',1, 0, 4, false]
```

### object

Define an object schema. Options passed into `isValid` are also passed to child schemas.
Supports all the same methods as [`mixed`](#mixed).

```javascript
yup.object().shape({
  name:      string().required(),
  age:       number().required().positive().integer(),
  email:     string().email(),
  website    string().url(),
})
```

You can also pass a shape to the object constructor as a convenience.

```js
object().shape({
  num: number()
})
//or
object({
  num: number()
})
```

The default `cast` behavior for `object` is: [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)

Failed casts return: `null`;


#### `object.shape(fields: object, noSortEdges: ?Array<[string, string]>): Schema`

Define the keys of the object and the schemas for said keys.

#### `object.from(fromKey: string, toKey: string, alias: boolean = false): Schema`

Transforms the specified key to a new key. If `alias` is `true` then the old key will be left.

```javascript
var schema = object({
    myProp: mixed(),
    Other: mixed(),
  })
  .from('prop', 'myProp')
  .from('other', 'Other', true)

inst.cast({ prop: 5, other: 6}) // => { myProp: 5, other: 6, Other: 6 }
```

#### `object.noUnknown(onlyKnownKeys: boolean = true, message: ?string): Schema`

Validate that the object value only contains keys specified in `shape`, pass `false` as the first
argument to disable the check. Restricting keys to known, also enables `stripUnknown` option, when not in strict mode.

#### `object.camelCase(): Schema`

Transforms all object keys to camelCase

#### `object.constantCase(): Schema`

Transforms all object keys to CONSTANT_CASE.



## Extending Schema Types

The simplest way to extend an existing type is just to cache a configured schema and use that through your application.

```js
  var yup = require('yup');
  var parseFormats = ['MMM dd, yyy']
  var invalidDate = new Date('');

  module.exports = yup.date()
    .transform(function(value, originalValue){
        if ( this.isType(value) ) return value
        //the default coercion transform failed so lets try it with Moment instead
        value = Moment(originalValue, parseFormats)
        return date.isValid() ? date.toDate() : invalidDate
    })
```

Alternatively, each schema is a normal JavaScript constructor function that you can mutate or delegate to
using the normal patterns. Generally you should not inherit from `mixed` unless you know what you are doing,
better to think of it as an abstract class. The other types are fair game though.

You should keep in mind some basic guidelines when extending schemas
  - never mutate an existing schema, always `clone()` and then mutate the new one before returning it.
  Built-in methods like `test` and `transform` take care of this for you, so you can safely use them (see below) without worrying
  - transforms should never mutate the `value` passed in, and should return an invalid object when one exists
  (`NaN`, `InvalidDate`, etc) instead of `null` for bad values.
  - by the time validations run the `value` is guaranteed to be the correct type, however if `nullable` is
  set then `null` is a valid value for that type, so don't assume that a property or method exists on the value.

__Adjust core Types__

```js
var invalidDate = new Date('');

function parseDateFromFormats(formats, parseStrict) {

  return this.transform(function(value, originalValue){
    if (this.isType(value))
      return value

    value = Moment(originalValue, formats, parseStrict)

    return date.isValid() ? date.toDate() : invalidDate
  })
}

// `addMethod` doesn't do anything special it's
// equivalent to: yup.date.protoype.format = parseDateFromFormats
yup.addMethod(yup.date, 'format', parseDateFromFormats)
```

__Creating new Types__

Yup schema use the common constructor pattern for modeling inheritance. You can use any
utility or pattern that works with that pattern. The below demonstrates using the es6 class
syntax since its less verbose, but you absolutely aren't required to use it.

```js
var DateSchema = yup.date
var invalidDate = new Date(''); // our failed to coerce value

class MomentDateSchemaType extends DateSchema {
  constructor() {
    super();
    this._validFormats = [];

    this.withMutation(() => {
      this.transform(function (value, originalvalue) {
        if (this.isType(value)) // we have a valid value
          return value
        return Moment(originalValue, this._validFormats, true)
      })
    })
  }

  _typeCheck(value) {
    return super._typeCheck(value)
        || (moment.isMoment(value) && value.isValid())
  }

  format(formats) {
    if (!formats)
      throw new Error('must enter a valid format')
    let next = this.clone()
    next._validFormats = {}.concat(formats);
  }
}

var schema = new MomentDateSchemaType()

schema
  .format('YYYY-MM-DD')
  .cast('It is 2012-05-25') // Fri May 25 2012 00:00:00 GMT-0400 (Eastern Daylight Time)
```
