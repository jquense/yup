'use strict';

var Promise = require('universal-promise')
  , Condition   = require('./util/condition')
  , locale = require('./locale.js').mixed
  , _ = require('./util/_')
  , isAbsent = require('./util/isAbsent')
  , cloneDeep = require('./util/clone')
  , createValidation = require('./util/createValidation')
  , BadSet = require('./util/set')
  , Ref = require('./util/reference')
  , SyncPromise = require('./util/syncPromise');

let notEmpty = value => !isAbsent(value);


function runValidations(validations, endEarly, value, path, sync) {
  return endEarly
    ? (sync ? SyncPromise.all(validations) : Promise.all(validations))
    : _.collectErrors({ validations, value, path, sync })
}

function extractTestParams(name, message, test, useCallback) {
  var opts = name;

  if (typeof message === 'function')
    test = message, message = locale.default, name = null;

  if (typeof name === 'function')
    test = name, message = locale.default, name = null;

  if (typeof name === 'string' || name === null)
    opts = { name, test, message, useCallback, exclusive: false }

  if (typeof opts.test !== 'function')
    throw new TypeError('`test` is a required parameters')

  return opts
}

module.exports = SchemaType

function SchemaType(options = {}){
  if ( !(this instanceof SchemaType))
    return new SchemaType()

  this._deps        = []
  this._conditions  = []
  this._options     = { abortEarly: true, recursive: true }
  this._exclusive   = Object.create(null)
  this._whitelist   = new BadSet()
  this._blacklist   = new BadSet()
  this.tests        = []
  this.transforms   = []

  this.withMutation(() => {
    this.typeError(locale.notType)
  })

  if (_.has(options, 'default'))
    this._defaultDefault = options.default

  this._type = options.type || 'mixed'
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone() {
    if (this._mutate)
      return this;

    return cloneDeep(this);
  },

  label(label) {
    var next = this.clone();
    next._label = label;
    return next;
  },

  meta(obj) {
    if (arguments.length === 0)
      return this._meta;

    var next = this.clone();
    next._meta = Object.assign(next._meta || {}, obj)
    return next;
  },

  withMutation(fn) {
    this._mutate = true
    let result = fn(this)
    this._mutate = false
    return result
  },

  concat(schema){
    if (!schema)
      return this

    if (schema._type !== this._type && this._type !== 'mixed')
      throw new TypeError(`You cannot \`concat()\` schema's of different types: ${this._type} and ${schema._type}`)
    var cloned = this.clone()
    var next = _.merge(this.clone(), schema.clone())

    // undefined isn't merged over, but is a valid value for default
    if (schema._default === undefined && _.has(this, '_default'))
      next._default = schema._default

    next.tests = cloned.tests;
    next._exclusive = cloned._exclusive;

    // manually add the new tests to ensure
    // the deduping logic is consistent
    schema.tests.forEach((fn) => {
      next = next.test(fn.TEST)
    });

    next._type = schema._type;

    return next
  },

  isType(v) {
    if( this._nullable && v === null) return true
    return !this._typeCheck || this._typeCheck(v)
  },

  resolve({ context, parent }) {
    if (this._conditions.length) {
      return this._conditions.reduce((schema, match) =>
        match.resolve(schema, match.getValue(parent, context)), this)
    }

    return this
  },

  cast(value, opts = {}) {
    let schema = this.resolve(opts)

    return schema._cast(value, opts)
  },

  _cast(_value) {
    let value = _value === undefined ? _value
      : this.transforms.reduce(
          (value, transform) => transform.call(this, value, _value), _value)

    if (value === undefined && (_.has(this, '_default'))) {
      value = this.default()
    }

    return value
  },

  validate(value, options = {}, cb) {
    if (typeof options === 'function')
      cb = options, options = {}

    let schema = this.resolve(options)
    let outputValue = schema._validate(value, options)

    return (options && options.sync)
      ? (options.__validating ? outputValue : outputValue.unwrap())
      : nodeify(outputValue, cb)
  },

  //-- tests
  _validate(_value, options = {}) {
    let value  = _value
      , schema, endEarly, isStrict;

    schema   = this
    isStrict = this._option('strict', options)
    endEarly = this._option('abortEarly', options)

    let { path, sync } = options
    let label = this._label

    if (!isStrict) {
      value = this._cast(value, options, options)
    }
    // value is cast, we can check if it meets type requirements
    let validationParams = { value, path, schema: this, options, label }
    let initialTests = []

    if (schema._typeError)
      initialTests.push(this._typeError(validationParams));

    if (this._whitelistError)
      initialTests.push(this._whitelistError(validationParams));

    if (this._blacklistError)
      initialTests.push(this._blacklistError(validationParams));

    return runValidations(initialTests, endEarly, value, path, sync)
      .then(() => runValidations(
          this.tests.map(fn => fn(validationParams))
        , endEarly
        , value
        , path
        , sync
      ))
      .then(() => value)
  },


  isValid(value, options = {}, cb) {
    if (typeof options === 'function')
      cb = options, options = {}

    let schema = this.resolve(options)
    let outputValue = schema
      ._validate(value, options)
      .then(() => true)
      .catch(err => {
        if ( err.name === 'ValidationError')
          return false

        throw err
      })

    return (options && options.sync)
      ? (outputValue.unwrap().value)
      : nodeify(outputValue, cb)
  },

  getDefault({ context, parent }) {
    return this._resolve(context, parent).default()
  },

  default(def) {
    if (arguments.length === 0) {
      var dflt = _.has(this, '_default') ? this._default : this._defaultDefault
      return typeof dflt === 'function'
        ? dflt.call(this) : cloneDeep(dflt)
    }

    var next = this.clone()
    next._default = def
    return next
  },

  strict() {
    var next = this.clone()
    next._options.strict = true
    return next
  },

  required(msg) {
    return this.test(
      'required',
      msg || locale.required,
      notEmpty
    )
  },

  nullable(value) {
    var next = this.clone()
    next._nullable = value === false ? false : true
    return next
  },

  transform(fn) {
    var next = this.clone();
    next.transforms.push(fn)
    return next
  },

  /**
   * Adds a test function to the schema's queue of tests.
   * tests can be exclusive or non-exclusive.
   *
   * - exclusive tests, will replace any existing tests of the same name.
   * - non-exclusive: can be stacked
   *
   * If a non-exclusive test is added to a schema with an exclusive test of the same name
   * the exclusive test is removed and further tests of the same name will be stacked.
   *
   * If an exclusive test is added to a schema with non-exclusive tests of the same name
   * the previous tests are removed and further tests of the same name will replace each other.
   */
  test(name, message, test, useCallback) {
    var opts = extractTestParams(name, message, test, useCallback)
      , next = this.clone();

    var validate = createValidation(opts);

    var isExclusive = (
      opts.exclusive ||
      (opts.name && next._exclusive[opts.name] === true)
    )

    if (opts.exclusive && !opts.name) {
      throw new TypeError('You cannot have an exclusive validation without a `name`')
    }

    next._exclusive[opts.name] = !!opts.exclusive

    next.tests = next.tests
      .filter(fn => {
        if (fn.TEST_NAME === opts.name) {
          if (isExclusive) return false
          if (fn.TEST.test === validate.TEST.test) return false
        }
        return true
      })

    next.tests.push(validate)

    return next
  },

  when(keys, options) {
    var next = this.clone()
      , deps = [].concat(keys).map(key => new Ref(key));

    deps.forEach(dep => {
      if (!dep.isContext)
        next._deps.push(dep.key)
    })

    next._conditions.push(new Condition(deps, options))

    return next
  },

  typeError(message) {
    var next = this.clone()

    next._typeError = createValidation({
      message,
      name: 'typeError',
      test(value) {
        if (value !== undefined && !this.schema.isType(value))
          return this.createError({
            params: {
              type: this.schema._type
            }
          })
        return true
      }
    })
    return next
  },

  oneOf(enums, message = locale.oneOf) {
    var next = this.clone();

    if (next.tests.length)
      throw new TypeError('Cannot specify values when there are validation rules specified')

    enums.forEach(val => {
      next._blacklist.delete(val)
      next._whitelist.add(val)
    })

    next._whitelistError = createValidation({
      message,
      name: 'oneOf',
      test(value) {
        let valids = this.schema._whitelist
        if (valids.length && !(value === undefined || valids.has(value)))
          return this.createError({
            params: {
              values: valids.values().join(', ')
            }
          })
        return true
      }
    })

    return next
  },

  notOneOf(enums, message = locale.notOneOf) {
    var next = this.clone();

    enums.forEach( val => {
      next._whitelist.delete(val)
      next._blacklist.add(val)
    })

    next._blacklistError = createValidation({
      message,
      name: 'notOneOf',
      test(value) {
        let invalids = this.schema._blacklist
        if (invalids.length && invalids.has(value))
          return this.createError({
            params: {
              values: invalids.values().join(', ')
            }
          })
        return true
      }
    })

    return next
  },

  strip(strip = true) {
    let next = this.clone()
    next._strip = strip
    return next
  },

  _option(key, overrides){
    return _.has(overrides, key)
      ? overrides[key] : this._options[key]
  },

  describe() {
    let next = this.clone();

    return {
      type: next._type,
      meta: next._meta,
      label: next._label,
      tests: next.tests.map((fn) => fn.TEST_NAME, {})
    }
  }
}


var aliases = {
  oneOf: ['equals', 'is'],
  notOneOf: ['not', 'nope']
}


for (var method in aliases) if ( _.has(aliases, method) )
  aliases[method].forEach(
    alias => SchemaType.prototype[alias] = SchemaType.prototype[method]) //eslint-disable-line no-loop-func


function nodeify(promise, cb){
  if(typeof cb !== 'function') return promise

  promise.then(val => cb(null, val), err => cb(err))
}

// [{ value, exclude }]

// values.every(({ value, exclude }) => {
//   var isEql = eql(value, otherval)
//   return (exclude && !isEql) || isEql
// })
