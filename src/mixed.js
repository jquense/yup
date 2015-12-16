'use strict';

var Promise = require('promise/lib/es6-extensions')
  , Condition   = require('./util/condition')
  , ValidationError = require('./util/validation-error')
  , locale = require('./locale.js').mixed
  , _ = require('./util/_')
  , cloneDeep = require('./util/clone')
  , createValidation = require('./util/createValidation')
  , BadSet = require('./util/set');

let formatError = ValidationError.formatError

module.exports = SchemaType

function SchemaType(options = {}){
  if ( !(this instanceof SchemaType))
    return new SchemaType()

  this._deps        = []
  this._options     = { abortEarly: true, recursive: true }
  this._exclusive   = Object.create(null)
  this._whitelist   = new BadSet()
  this._blacklist   = new BadSet()
  this.tests        = []
  this.transforms   = []
  this._typeError   = formatError(locale.notType)

  if (_.has(options, 'default'))
    this._defaultDefault = options.default

  this._type = options.type || 'mixed'
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone(){
    return cloneDeep(this);
  },

  concat(schema){
    if (!schema)
      return this

    if (schema._type !== this._type && this._type !== 'mixed')
      throw new TypeError(`You cannot \`concat()\` schema's of different types: ${this._type} and ${schema._type}`)

    var next = _.merge(this.clone(), schema.clone())

    // undefined isn't merged over, but is a valid value for default
    if (schema._default === undefined && _.has(this, '_default'))
      next._default = schema._default

    // trim exclusive tests, take the most recent ones
    next.tests = _.uniq(next.tests.reverse(),
      (fn, idx) => next[fn.VALIDATION_KEY] ? fn.VALIDATION_KEY : idx).reverse()

    next._type = schema._type;

    return next
  },

  isType(v) {
    if( this._nullable && v === null) return true
    return !this._typeCheck || this._typeCheck(v)
  },

  cast(_value, _opts) {
    var schema = this._resolve((_opts || {}).context)
    return schema._cast(_value, _opts)
  },

  _cast(_value) {
    let value = _value === undefined ? _value
      : this.transforms.reduce(
          (value, transform) => transform.call(this, value, _value), _value)


    if( value === undefined && _.has(this, '_default') )
      value = this.default()

    return value
  },

  _resolve(context, parent){
    var schema  = this;

    return this._deps.reduce((schema, match) =>
      match.resolve(schema, match.getValue(parent, context)), schema)
  },

  //-- tests
  _validate(value, options = {}, state = {}) {
    let valids   = this._whitelist
      , invalids = this._blacklist
      , context  = options.context
      , parent   = state.parent
      , schema, endEarly, isStrict;

    schema   = this._resolve(context, parent)
    isStrict = schema._option('strict', options)
    endEarly = schema._option('abortEarly', options)

    let path = state.path

    let errors = [];
    let reject = () => Promise.reject(new ValidationError(errors, value, path));

    if ( !state.isCast && !isStrict )
      value = schema._cast(value, options)

    // value is cast, we can check if it meets type requirements
    if ( value !== undefined && !schema.isType(value) ){
      errors.push(schema._typeError({ value, path, type: schema._type }))
      if ( endEarly ) return reject()
    }

    // next check Whitelist for matching values
    if ( valids.length && !valids.has(value) ) {
      errors.push(schema._whitelistError(valids.values(), path))
      if ( endEarly ) return reject()
    }

    // next check Blacklist for matching values
    if ( invalids.has(value) ){
      errors.push(schema._blacklistError(invalids.values(), path))
      if ( endEarly ) return reject()
    }

    // It makes no sense to validate further at this point if their are errors
    if ( errors.length )
      return reject()

    let result = schema.tests.map(fn => fn({ value, path, state, schema, options }))

    result = endEarly
      ? Promise.all(result)
      : _.collectErrors(result, value, path)

    return result.then(() => value);
  },

  validate(value, options, cb) {
    if (typeof options === 'function')
      cb = options, options = {}

    return nodeify(this._validate(value, options, {}), cb)
  },

  isValid(value, options, cb) {
    if (typeof options === 'function')
      cb = options, options = {}

    return nodeify(this
      .validate(value, options)
      .then(() => true)
      .catch(err => {
        if ( err.name === 'ValidationError')
          return false

        throw err
      }), cb)
    },

  default(def) {
    if( arguments.length === 0){
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
    return this.test({
      name: 'required',
      exclusive: true,
      message:  msg || locale.required,
      test: value => value != null
    })
  },

  typeError(msg){
    var next = this.clone()
    next._typeError = formatError(msg)
    return next
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

  test(name, message, test, useCallback) {
    var opts = name
      , next = this.clone()
      , isExclusive;

    if (typeof name === 'string') {
      if (typeof message === 'function')
        test = message, message = name, name = null

      opts = { name, test, message, useCallback, exclusive: false }
    }

    if (typeof opts.message !== 'string' || typeof opts.test !== 'function')
      throw new TypeError('`message` and `test` are required parameters')

    if (next._whitelist.length)
      throw new Error('Cannot add tests when specific valid values are specified')

    var validate = createValidation(opts)

    isExclusive = opts.name && next._exclusive[opts.name] === true

    if (opts.exclusive || isExclusive) {
      if (!opts.name)
        throw new TypeError('You cannot have an exclusive validation without a `name`')

      next._exclusive[opts.name] = true
      validate.VALIDATION_KEY = opts.name
    }

    if (isExclusive)
      next.tests = next.tests.filter(fn => fn.VALIDATION_KEY !== opts.name)

    next.tests.push(validate)

    return next
  },

  when(key, options){
    var next = this.clone()
      , dep = new Condition(key, next._type, options);

    next._deps.push(dep)

    return next
  },

  oneOf(enums, msg) {
    var next = this.clone()

    if( next.tests.length )
      throw new TypeError('Cannot specify values when there are validation rules specified')

    next._whitelistError = (valids, path) =>
      formatError(msg || locale.oneOf, { values: valids.join(', '), path })

    enums.forEach( val => {
      next._blacklist.delete(val)
      next._whitelist.add(val)
    })

    return next
  },

  notOneOf(enums, msg) {
    var next = this.clone()

    next._blacklistError = (invalids, path) =>
      formatError(msg || locale.notOneOf, { values: invalids.join(', '), path })

    enums.forEach( val => {
      next._whitelist.delete(val)
      next._blacklist.add(val)
    })

    return next
  },

  _option(key, overrides){
    return _.has(overrides, key)
      ? overrides[key] : this._options[key]
  }
}


var aliases = {
  oneOf: ['equals', 'is'],
  notOneOf: ['not', 'nope']
}


for( var method in aliases ) if ( _.has(aliases, method) )
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
