Yup
=======================

Yup is a JavaScript object schema validator and object parser. The API and style is ~~stolen~~ heavily inspired
by [Joi](https://github.com/hapijs/joi), which is an amazing library but is generally too large and difficult
to package for use in a browser. Yup is a leaner in the same spirit without some of the fancy features.
You can use it on the server as well, but in that case you might as well just use Joi.

Yup is also a a good bit less opinionated than joi, allowing for custom transformations and async validation.
It also allows "stacking" conditions via `when` for properties that depend on more than one other sibling or
child property. Yup separates the parsing and validating functions into separate steps so it can be used to parse
json separate from validating it, via the `cast` method.

## Usage

  - [Yup](#yup-1)
    + [`mixed`](#mixed)
    + [`string`](#string)
    + [`number`](#number)
    + [`boolean`](#boolean)
    + [`date`](#date)
    + [`array`](#array)
    + [`object`](#array)
  - [`reach`](#reachschema-schema-string-path-object-options)
  - [`addMethod`](#addmethodschematype-name-method)
  - [`ValidationError`](#validationerrorstringarraystring-errors-string-path-any-value)
  - [Extending Schema Types](#extending-schema-types)

You define and create schema objects. Schema objects are immutable, so each call of a method returns a _new_ schema object.

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

#### `.reach(Schema schema, String path, Object options)`

For nested schema's `yup.reach` will retrieve a nested schema based on the provided path.

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

#### `.addMethod(schemaType, name, method)`

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

#### `ValidationError(String|Array<String> errors, Any value, String path)`

Thrown on failed validations, with the following properties
 - `name`: ValidationError
 - `path`: a string, indicating where there error was thrown. `path` is empty at the root level.
 - `errors`: array of error messages
 - `inner`: in the case of aggregate errors, inner is an array of `ValidationErrors` throw earlier in the
 validation chain. When the `abortEarly` option is `false` this is where you can inspect each error thrown,
 alternatively `errors` will have all the of the messages from each inner error.


### `mixed`

Creates a schema that matches all types. All types inherit from this base type

```javascript
var schema = yup.mixed();
schema.isValid(undefined, function(valid){
  valid //=> true
})
```

#### `mixed.clone()`

Creates a deep copy of the schema. Clone is used internally to return a new schema with every schema state change.

#### `mixed.concat(Schema schema)`

Creates a new instance of the schema by combining two schemas. Only schemas of the same type can be concatenated.

#### `mixed.validate(Any value, [Object options, Function callback])`

Returns the value (a cast value if `isStrict` is `false`) if the value is valid, and returns the errors otherwise.
This method is __asynchronous__ and returns a Promise object, that is fulfilled with the value, or rejected
with a `ValidationError`. If you are more comfortable with Node style callbacks, then you can provide one
to be called when the validation is complete (called with the Error as the first argument, and value
as the second).


The `options` argument is an object hash containing any schema options you may want to override
(or specify for the first time).

- `strict` -> boolean: default `false`, only validate the input, and skip and coercion or transformation
- `abortEarly` -> boolean: default `true`, return from validation methods on the first error rather
than after all validations run.
- `stripUnknown` -> boolean: default `false` remove unspecified keys from objects.
- `recursive` -> boolean: default `true` when `false` validations will not descend into sub schemas
(relavant for objects or arrays).
- `context` -> an `object` containing any context for validating schema conditions (see: `when()`)

```javascript
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

#### `mixed.isValid(Any value, [Object options, Function callback]) -> Promise`

Returns `true` when the passed in value matches the schema. if `false` then the schema also has a `.errors`
field which is an array of validation error messages (strings), thrown by the schema. `isValid`
is __asynchronous__ and returns a Promise object. If you are more comfortable with Node style callbacks,
providing a function as the last argument will opt into that interface.

Takes the same options as `validate()`.

#### `mixed.cast(value) -> Any`

Attempts to coerce the passed in value to a value that matches the schema. For example: `'5'` will
cast to `5` when using the `number()` type. Failed casts generally return `null`, but may also
return results like `NaN` and unexpected strings.

#### `mixed.isType(Any value) -> Boolean`

Runs a type check against the passed in `value`. It returns true if it matches,
it does not cast the value. When `nullable()` is set `null` is considered a valid value of the type.
You should use `isType` for all Schema type checks.

#### `mixed.strict()` (default: `false`)

Sets the `strict` option to `true`. Strict schemas skip coercion and transformation attempts,
validating the value "as is".

#### `mixed.default(Any value)`

Sets a default value to use when the value is `undefined` (or `null` when the schema is not nullable).
Defaults are created after transformations are executed, but before validations, to help ensure that safe
defaults are specified. The default value will be cloned on each use, which can incur performance penalty
for objects and arrays. To avoid this overhead you can also pass a function that returns an new default.

```js
  yup.string.default('nothing');

  yup.object.default({ number: 5}); // object will be cloned every time a default is needed

  yup.object.default(() => ({ number: 5})); // this is cheaper

  yup.date.default(() => new Date()); //also helpful for defaults that change over time

```

#### `mixed.default() -> Any`

Calling `default` with no arguments will return the current default value


#### `mixed.typeError(String message)` (default: '${path} (value: \`${value}\`) must be a \`${type}\` type')

Define an error message for failed type checks. The `${value}` and `${type}` interpolation can
be used in the `message` argument.

#### `mixed.nullable(Bool isNullable)` (default: `false`)

Indicates that `null` is a valid value for the schema. Without `nullable()`
`null` is treated as a different type and will fail `isType()` checks.

#### `mixed.required([String message])`

Mark the schema as required. All field values apart from `undefined` meet this requirement.

#### `mixed.oneOf(Array<Any> arrayOfValues, [String message])` Alias: `equals`

Whitelist a set of values. Values added are automatically removed from any blacklist if they are in it.
The `${values}` interpolation can be used in the `message` argument.

```javascript
var schema = yup.mixed().oneOf(['jimmy', 42]);
schema.isValid(42)       //=> true
schema.isValid('jimmy')  //=> true
schema.isValid(new Date) //=> false
```

#### `mixed.notOneOf(Array<Any> arrayOfValues, [String message])`

Blacklist a set of values. Values added are automatically removed from any whitelist if they are in it.
The `${values}` interpolation can be used in the `message` argument.

```javascript
var schema = yup.mixed().notOneOf(['jimmy', 42]);
schema.isValid(42)       //=> false
schema.isValid(new Date) //=> true
```

#### `mixed.when(String key, Object options | Function func)`

Adjust the schema based on a sibling or sibling children fields. You can provide an object
literal where the key `is` is value or a matcher function, `then` provides the true schema and/or
`otherwise` for the failure condition.

`is` conditions are strictly compared (`===`) if you want to use a different form of equality you
can provide a function like: `is: (value) => value == true`.

Alternatively you can provide a function the returns a schema (called with the value of the key
  and the current schema). `when` conditions are additive.

Like joi you can also prefix properties with `$` to specify a property that is dependent
on `context` passed in by `validate()` or `isValid`.

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


#### `mixed.test(String name, String message, Function fn, [Bool callbackStyleAsync])`

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

the `test` function is called with the current `value`, along with `path` and `context` if they exist.
For more advanced validations you can use the alternate signature to provide more options (see below):

```js
var jimmySchema = yup.string()
  .test('is-jimmy', '${path} is not Jimmy', value => value === 'jimmy');

// or make it async by returning a promise
var asyncJimmySchema = yup.string()
  .test('is-jimmy', '${path} is not Jimmy', function (value){
    return fetch('/is-jimmy/' + value)
      .then(response => response.responseText === 'true')
  });

// or callback style for asynchrony
var asynCallbackJimmySchema = yup.string()
  .test('is-jimmy', '${path} is not Jimmy', test, true);

function test(value, done){
  // error argument is for exceptions, not an failed tests
  done(null, value === 'jimmy')
}

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


#### `mixed.test(Object options)`

Alternative `test(..)` signature. `options` is an object containing some of the following options:

- `name`: string, all validations must have a name.
- `test`: function(value), the validator run against the value, should return `true`
or `false` or a promise that resolves to `true` or `false`
- `message`: string, validation error message
- `params`: object, passed to message for interpolation
- `exclusive`: boolean (default `false`), when true, there can only be one active
`test` of the same name on a schema, validations of the same name will replace previous ones.
when `false` the validations will stack. e.g. `max` is an exclusive validation,
whereas the string `matches` is not. This is helpful for "toggling" validations on and off.
- `useCallback`: boolean (default `false`), use the callback interface for asynchrony instead of promises

```javascript
var schema = yup.mixed().test({
      name: 'max',
      exclusive: true,
      params: { max },
      message: '${path} must be less than ${max} characters',
      test: value => value == null || value.length <= max
    });
```

#### `mixed.transform(Function fn)`

Adds a transformation to the transform chain. Transformations are central to the casting process,
default transforms for each type coerce values to the specific type (as verified by [`isType()`](mixedistypevalue)).
transforms are run before validations and only applied when `strict` is `true`. Some types have built in transformations.

Transformations are useful for arbitrarily altering how the object is cast, __however, you should take care
not to mutate the passed in value.__ Transforms are run sequentially so each `value` represents the
current state of the cast, you can use the `orignalValue` param if you need to work on the raw initial value.

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

#### `string.required([String message])`

The same as the `mixed()` schema required, except that empty strings are also considered 'missing' values.
To allow empty strings but fail on `undefined` values use: `string().required().min(0)`

#### `string.min(Number limit, [String message])`

Set an minimum length limit for the string value. The `${min}` interpolation can be used in the `message` argument

#### `string.max(Number limit, [String message])`

Set an maximum length limit for the string value. The `${max}` interpolation can be used in the `message` argument

#### `string.matches(Regex regex, [String message])`

Provide an arbitrary `regex` to match the value against.

```javascript
var v = string().matches(/(hi|bye)/);
v.isValid('hi').should.eventually.equal(true)
v.isValid('nope').should.eventually.equal(false)
```

#### `string.email([String message])`

Validates the value as an email address via a regex.

#### `string.url([String message])`

Validates the value as a valid URL via a regex.


#### `string.trim([String message])`

Transforms string values by removing leading and trailing whitespace. If
`strict()` is set it will only validate that the value is trimmed.

#### `string.lowercase([String message])`

Transforms the string value to lowercase. If `strict()` is set it will only validate that the value is lowercase.

#### `string.uppercase([String message])`

Transforms the string value to uppercase. If `strict()` is set it will only validate that the value is uppercase.

### number

Define a number schema. Supports all the same methods as [`mixed`](#mixed).

```javascript
var schema = yup.number();
schema.isValid(10) //=> true
```

#### `number.min(Number limit, [String message])`

Set the minimum value allowed. The `${min}` interpolation can be used in the
`message` argument.

#### `number.max(Number limit, [String message])`

Set the maximum value allowed. The `${max}` interpolation can be used in the
`message` argument.

#### `number.positive([String message])`

Value must be a positive number.

#### `number.negative([String message])`

Value must be a negative number.

#### `number.integer([String message])`

Transformation that coerces the value into an integer via truncation
` value | 0`. If `strict()` is set it will only validate that the value is an integer.

#### `round(String type)` - 'floor', 'ceil', 'round'

Rounds the value by the specified method (defaults to 'round').


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

#### `date.min(Date|String limit, [String message])`

Set the minimum date allowed.

#### `date.max(Date|String limit, [String message])`

Set the maximum date allowed.

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

### `array.of(Schema type)`

Specify the schema of array elements. `of()` is optional and when omitted the array schema will
not validate its contents.

#### `array.required([String message])`

The same as the `mixed()` schema required, except that empty arrays are also considered 'missing' values.
To allow empty arrays but fail on `undefined` values use: `array().required().min(0)`

#### `array.min(Number limit, [String message])`

Set an minimum length limit for the array. The `${min}` interpolation can be used in the `message` argument.

#### `array.max(Number limit, [String message])`

Set an maximum length limit for the array. The `${max}` interpolation can be used in the `message` argument.

### `array.compact(Function rejector)`

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

#### `object.shape(Object schemaHash, [noSortEdges])`

Define the keys of the object and the schemas for said keys.

#### `object.from(String fromKey, String toKey, Bool alias)`

Transforms the specified key to a new key. If `alias` is `true` then the old key will be left.

```javascript
var schema = object()
      .shape({
        myProp: mixed(),
        Other: mixed(),
      })
      .from('prop', 'myProp')
      .from('other', 'Other', true)

inst.cast({ prop: 5, other: 6}) // => { myProp: 5, other: 6, Other: 6 }
```


#### `object.noUnknown([Bool onlyKnownKeys, String msg])`

Validate that the object value only contains keys specified in `shape`, pass `false` as the first
argument to disable the check. Restricting keys to known, also enables `stripUnknown` option, when not in strict mode.

#### `object.camelcase()`

Transforms all object keys to camelCase

#### `object.constantcase()`

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

    if ( this.isType(value) ) return value

    value = Moment(originalValue, formats, parseStrict)

    return date.isValid() ? date.toDate() : invalidDate
  })
}

// `addMethod` doesn't do anything special it's
// equivalent to: yup.date.protoype.format = parseDateFromFormats
yup.addMethod(yup.date, 'format', parseDateFromFormats)
```

__Creating new Types__
```js
  var inherits = require('inherits')
  var invalidDate = new Date(''); // our failed to coerce value

  function MomentDateSchemaType(){
    // so we don't need to use the `new` keyword
    if ( !(this instanceof MomentDateSchemaType))
      return new MomentDateSchemaType()

    yup.date.call(this)
  }

  inherits(MomentDateSchemaType, yup.date)

  MomentDateSchemaType.prototype.format = function(formats, strict){
    if (!formats) throw new Error('must enter a valid format')

    this.transforms.push(function(value, originalValue) {
      if ( this.isType(value) ) // we have a valid value
        return value
      value = Moment(originalValue, formats, strict)
      return value.isValid() ? value.toDate() : invalidDate
    })
  }

  var schema = MomentDateSchemaType().format('YYYY-MM-DD')

  schema.cast('It is 2012-05-25') // Fri May 25 2012 00:00:00 GMT-0400 (Eastern Daylight Time)
```
