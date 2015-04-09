'use strict';
var interpolate = require('./util/interpolate')
  , Promise = require('es6-promise').Promise
  , Condition   = require('./util/condition')
  , ValidationError = require('./util/validation-error')
  , getter = require('property-expr').getter
  , locale = require('./locale.js').mixed
  , _ = require('./util/_')
  , cloneDeep = require('./util/clone')
  , BadSet = require('./util/set');

module.exports = SchemaType

function SchemaType(options = {}){
  if ( !(this instanceof SchemaType))
    return new SchemaType()

  this._deps        = []
  this._conditions  = []
  this._options     = {}
  this._exclusive   = Object.create(null)
  this._whitelist   = new BadSet()
  this._blacklist   = new BadSet()
  this.validations  = []
  this.transforms   = []

  if (_.has(options, 'default'))
    this._default = options.default

  this._type = options.type || 'mixed'
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone(){
    return cloneDeep(this);
  },

  concat(schema){
    var next = _.merge(this.clone(), schema.clone())

    // undefined isn't merged over, but is a valid value for default
    if ( _.has(schema, '_default') && schema._default === undefined )
      next._default = schema._default

    // trim exclusive validations, take the most recent ones
    next.validations = _.uniq(next.validations.reverse(), 
      (fn, idx) => next[fn.VALIDATION_KEY] ? fn.VALIDATION_KEY : idx).reverse()

    return next
  },

  isType(v) {
    if( this._nullable && v === null) return true
    return !this._typeCheck || this._typeCheck(v)
  },

  cast(_value, _opts) {
    var schema = this._resolve((_opts|| {}).context)
    return schema._cast(_value, _opts)
  },

  _cast(_value) {
    var value = this._coerce && _value !== undefined 
          ? this._coerce(_value) 
          : _value

    if( value === undefined && _.has(this, '_default') )
      value = this.default()

    return value === undefined ? value
      : this.transforms.reduce(
          (value, transform) => transform.call(this, value, _value), value)
  },

  _resolve(context){
    var schema  = this;
    
    return this._conditions.reduce(function(schema, match){
      if(!context) throw new Error('missing the context necessary to cast this value')
      return match.resolve(schema, getter(match.key)(context))
    }, schema)
  },

  //-- validations
  _validate(value, _opts, _state) {
    var valids   = this._whitelist
      , invalids = this._blacklist
      , context  = (_opts || {}).context || _state.parent
      , schema, valid, state, isStrict;

    state    = _state
    schema   = this._resolve(context)
    isStrict = schema._option('strict', _opts)

    !state.path && (state.path = 'this')

    var errors = [];

    if( !state.isCast && !isStrict )
      value = schema._cast(value, _opts)

    if ( value !== undefined && !schema.isType(value) ){
      errors.push(`value: ${value} must be a ${schema._type} type`)
      return Promise.reject(new ValidationError(errors))
    }

    if( valids.length ) {
      valid = valids.has(value)

      if( !valid ) 
        return Promise.reject(new ValidationError(errors.concat(
            schema._whitelistError({ values: valids.values().join(', '), ...state }))
          ))
    }

    if( invalids.has(value) ) {
      return Promise.reject(new ValidationError(errors.concat(
          schema._blacklistError({ values: invalids.values().join(', '), ...state }))
        ))
    }

    return Promise
      .all(schema.validations.map(fn => fn.call(schema, value, state)))
      .then(() => {
        if ( errors.length ) 
          throw new ValidationError(errors)

        return value
      });
  },

  validate(value, options, cb){
    if (typeof options === 'function')
      cb = options, options = {}

    return nodeify(this._validate(value, options, {}), cb)
  },

  isValid(value, options, cb){
    if (typeof options === 'function')
      cb = options, options = {}

    return nodeify(this
      .validate(value, options)
      .then(() => true)
      .catch(err => {
        if ( err instanceof ValidationError) return false
        throw err
      }), cb)
    },

  default(def) {
    if( arguments.length === 0){
      var dflt = this._default
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
    return this.validation(
      { name: 'required', exclusive: true, message:  msg || locale.required },
      value => value !== undefined && this.isType(value))
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

  validation(message, validator, passInDoneCallback) {
    var opts = message
      , next = this.clone()
      , errorMsg, isExclusive;

    if(typeof message === 'string')
      opts = { message, exclusive: false, name: validator.name || undefined }

    if( next._whitelist.length )
      throw new TypeError('Cannot add validations when specific valid values are specified')

    errorMsg = interpolate(opts.message)
    isExclusive = opts.name && next._exclusive[opts.name] === true

    if( opts.exclusive ){
      if (!opts.name)
        throw new TypeError('You cannot have an exclusive validation without a name to identify it')
      
      next._exclusive[opts.name] = true
      validate.VALIDATION_KEY = opts.name
    }

    if( isExclusive )
      next.validations = next.validations.filter( fn => fn.VALIDATION_KEY !== opts.name)

    next.validations.push(validate)

    return next

    function validate(value, state) {
      return new Promise((resolve, reject) => {
        !passInDoneCallback
          ? resolve(validator.call(this, value))
          : validator.call(this, value, (err, valid) => err ? reject(err) : resolve(valid))
      })
      .then(valid => {
        if (!valid) 
          throw new ValidationError(errorMsg({ path: state.path, ...opts.params }))
      })
    }
  },

  when(key, options){
    var next = this.clone();

    next._deps.push(key)
    next._conditions.push(new Condition(key, next, options))
    return next
  },

  oneOf(enums, msg) {
    var next = this.clone()

    if( next.validations.length )
      throw new TypeError('Cannot specify values when there are validation rules specified')

    next._whitelistError = interpolate(msg || next._whitelistError || locale.oneOf)

    enums.forEach( val => {
      next._blacklist.delete(val)
      next._whitelist.add(val)
    })

    return next
  },

  notOneOf(enums, msg) {
    var next = this.clone()

    next._blacklistError = interpolate(msg || next._blacklistError || locale.notOneOf)

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
  oneOf: ['equals']
}

for( var method in aliases ) if ( _.has(aliases, method) )
  aliases[method].forEach(
    alias => SchemaType.prototype[alias] = SchemaType.prototype[method])
  

function nodeify(promise, cb){
  if(typeof cb !== 'function') return promise

  promise.then(val => cb(null, val), err => cb(err))
}
