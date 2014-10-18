Yup
=======================

a js object schema validation. The api and style is definately inspired by/stolen from [Joi](https://github.com/hapijs/joi) which is an amazing library but generally too big and feature rich for my browser validation needs. Yup is a lean lib in the same spirit without the fancy features. You can use it on the server as well, but in that case you might as well just use Joi.

## Usage

You define and create schema objects. Schema objects are immutable, so each call of a method returns a _new_ schema object.
  
    var yup = require('yup')

    var schema = yup.object().shape({
      name:      yup.string().required(),
      age:       yup.number().required().positive().integer(),
      email:     yup.string().email(),
      website    yup.string().url(),
      createdOn: yup.date().default(function() { 
        return new Date 
      }),
    })

    //check validity
    schema.isValid({
      name: 'jimmy',
      age: 24
    })  
    // => true

    //you can try and type cast objects to the defined schema
    schema.cast({
      name: 'jimmy',
      age: '24',
      createdOn: '2014-09-23T19:25:25Z'
    })
    // => { name: 'jimmy', age: 24, createdOn: Date }

### `mixed`

Creates a schema that matches all types. All types inherit from this base type

```javascript
var schema = yup.mixed();
schema.isValid() //=> true
```

#### `mixed.clone()`

Creates a new instance of the schema. Clone is used internally to return a new schema with every schema state change. 

#### `mixed.isValid(value, options)`

Returns `true` when the passed in value matches the schema. if `false` then the schema also has a `.errors` field which is an array of validation error messages (strings), throw by the schema.

the `options` argument is an object hash containing any schema options you may want to override (or specify for the first time).

- `strict` -> boolean: default `false`

#### `mixed.cast(value)`

Attempts to coerce the passed in value to a value that matches the schema. For example: `'5'` will cast to `5` when useing the `number()` type. Failed casts generally return `null`, but may also results like `NaN` and unexpected strings.

#### `mixed.isType(value)`

Runs a type check against the passed in `value`. It returns true if it matches, it does not cast the value.

#### `mixed.strict()`

Sets the `strict` option to `true`, telling the schema to not try and cast the passed in value before validating it.

#### `mixed.default(value)`

Sets a default value to use when the value is missing. The `value` argument can also be a function that returns a default value (useful for setting defaults of by reference types like arrays or objects).

#### `mixed.nullable(isNullable)`

Indicates that `null` is a valid value for the schema. Without `nullable()` 
`null` is treated as an empty value and will fail `isType` checks.

#### `mixed.required(msg)`

Mark the schema as required. All field values asside from `undefined` meet this requirement.

#### `mixed.oneOf(arrayOfValues)`

Whitelist a set of values. Values added are automatically removed from any blacklist if they are in it.

```javascript
var schema = yup.mixed().oneOf(['jimmy', 42]);
schema.isValid(42)       //=> true
schema.isValid('jimmy')  //=> true
schema.isValid(new Date) //=> false
```

#### `mixed.notOneOf(arrayOfValues)`

Blacklist a set of values. Values added are automatically removed from any whitelist if they are in it.

```javascript
var schema = yup.mixed().notOneOf(['jimmy', 42]);
schema.isValid(42)       //=> false
schema.isValid(new Date) //=> true
```

#### `mixed.validation(message, fn)`

Adds a validation function to the validation chain. Validations are run after any object is cast. Many types have some validations built in, but you can create custom ones easily.

for the `message` argument you can provide a string which is will interpolate certain keys if specified, all validations are given a `path` value which indicates location.

```javascript
var schema = yup.mixed().validation('${path} is invalid!', function(value){
  return value !== 'jimmy'
});
schema.isValid('jimmy') //=> true

schema.isValid('john') //=> false
schema.errors // => [ 'this is invalid!']
```

#### `mixed.transform(fn)`

Adds a transformation to the transform chain. Transformations are part of the casting process and run after the value is coerced, but before validations. Some types have built in transformations. 

Transformations are useful for arbitrarily altering how the object is cast.

```javascript
var schema = yup.string().transform(function(value){
  return value.toUpperCase()
});
schema.cast('jimmy') //=> 'JIMMY'
```

#### Static Methods

- `Mixed.create(props)` - creates a new instance of a type with the specified props
- `Mixed.extend(protoProps)` - Backbone-esque object inheritanc. extend returns a new constructor function that inherits from the type. All types inherit `mixed` in this manner.


### string

Define a string schema. __note: strings are nullable by default.__ 

```javascript
var schema = yup.string();
schema.isValid('hello') //=> true
```

#### `string.min(limit, message)`

Set an yupmum length limit for the string value. The `${min}` interpolation can be used in the `message` argument

#### `string.max(limit, message)`

Set an maximum length limit for the string value. The `${max}` interpolation can be used in the `message` argument

#### `string.matches(regex, message)`

Provide an arbitrary `regex` to match the value against.

```javascript
var v = string().matches(/(hi|bye)/);
v.isValid('hi').should.equal(true)
v.isValid('nope').should.equal(false)
```

#### `string.email(message)`

Validates the value as an email address via a regex.

#### `string.url(message)`

Validates the value as a valid URL via a regex.


#### `string.trim()`

Transforms string values by removing leading and trailing whitespace.

#### `string.lowercase()`

Transforms the string value to lowercase.

#### `string.uppercase()`

Transforms the string value to uppercase.

### number

Define a number schema.

```javascript
var schema = yup.number();
schema.isValid(10) //=> true
```

#### `number.min(limit, message)`

Set the yupmum value allowed.

#### `number.max(limit, message)`

Set the maximum value allowed.

#### `number.positive(message)`

Value must be a positive number.

#### `number.negative(message)`

Value mut be a negative number.

#### `number.integer()`

Transformation that coerces the value into an integer via truncation ` value | 0`

#### `round(type)` - 'floor', 'ceil', 'round'

Rounds the value by the specified method (defaults to 'round').


### boolean

Define a boolean schema.

```javascript
var schema = yup.boolean();
schema.isValid(true) //=> true
```

### date

Define a Date schema. By default ISO date strings will parse correctly.

```javascript
var schema = yup.date();
schema.isValid(new Date) //=> true
```

#### `date.min(limit, message)`

Set the yupmum date allowed.

#### `date.max(limit, message)`

Set the maximum date allowed.

### array

Define an array schema. Arrays can be typed or not, When specifying the element type, `cast` and `isValid` will apply to the elements as well. Options passed into `isValid` are passed also passed to child schemas.

```javascript
var schema = yup.array().of(number().min(2));
schema.isValid([2, 3])   //=> true
schema.isValid([1, -24]) //=> false

schema.cast(['2', '3'])  //=> [2, 3] 
```

### `array.of(type)`

Specify the schema of array elements. It can be any schemaType, and is not required.

#### `array.min(limit, message)`

Set an yupmum length limit for the array.

#### `array.max(limit, message)`

Set an maximum length limit for the array.

### `array.compact(rejector)`

Removes falsey values from the array. Providing a rejector function lets you specify the rejection criteria yourself.

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

Define an object schema. Options passed into `isValid` are passed also passed to child schemas.

```javascript
yup.object().shape({
  name:      string().required(),
  age:       number().required().positive().integer(),
  email:     string().email(),
  website    string().url(),
}) 
```

#### `object.shape(schemaHash)`

Define the keys of the object and the schemas for said keys.

#### `object.from(fromKey, toKey, alias)`

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

#### `object.camelcase()`

Transforms all object keys to camelCase

#### `object.constantcase()`

Transforms all object keys to CONSTANT_CASE.
