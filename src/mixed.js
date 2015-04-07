'use strict';
var interpolate = require('./util/interpolate')
  , Promise = require('es6-promise').Promise
  , Condition   = require('./util/condition')
  , ValidationError = require('./util/validation-error')
  , getter = require('property-expr').getter
  , locale = require('./locale.js').mixed
  , transform = require('./util/transform')
  , assign = require('./util/assign')
  , clone = require('./util/clone')
  , BadSet = require('./util/set')
  , has = require('./util/has');

var toString = Object.prototype.toString
var isObject = obj => obj && toString.call(obj) === '[object Object]';
var isPlainObject = obj => isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;

var initProps;

module.exports = SchemaType

function SchemaType(){
  var props;

  if ( !(this instanceof SchemaType))
    return new SchemaType()

  props = initProps;
  initProps = null;

  this._deps        = []
  this._conditions  = []
  this._options     = {}
  this._activeTests = {}
  this._whitelist   = new BadSet()
  this._blacklist   = new BadSet()
  this.validations  = []
  this.transforms   = []

  assign(this, props)

  this._type = 'mixed'
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone: function(){
    return this.constructor.create(
      transform(this, (obj, val, key) => {
        obj[key] = val.clone
          ? val.clone()
          : Array.isArray(val)
            ? val.slice()
            : isPlainObject(val)
              ? {...val}
              : val
      }, {})
    )
  },

  concat(schema){
    return merge(this.clone(), schema.clone())
  },

  isType(value){
    if ( this._nullable && value === null ) return true
    return value !== undefined
  },

  cast(_value, _opts){
    var schema = this._resolve((_opts|| {}).context)
    return schema._cast(_value, _opts)
  },

  _cast(_value){
    var value  = this._coerce ? this._coerce(_value) : _value

    if( value == null && has(this, '_default') )
      value = this._nullable && value === null
        ? value
        : this.default()

    return this.transforms.reduce(
      (value, transform) => transform.call(this, value), value)
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
      errors.push(`value: ${value} is must be a ${schema._type} type`)
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
      var dflt = has(this, '_default') 
        ? this._default
        : this._initialDefault

      return typeof dflt === 'function' 
        ? dflt() : clone(dflt)
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
      { hashKey: 'required',  message:  msg || locale.required },
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

  validation(msg, validator, passInDoneCallback){
    var opts = msg
      , next = this.clone()
      , hashKey, errorMsg;

    if(typeof msg === 'string')
      opts = { message: msg }

    if( next._whitelist.length )
      throw new TypeError('Cannot add validations when specific valid values are specified')

    errorMsg = interpolate(opts.message)
    hashKey = opts.hashKey

    if( !hashKey || !has(next._activeTests, hashKey) ){
      if( hashKey ) next._activeTests[hashKey] = true
      next.validations.push(validate)
    }

    return next

    function validate(value, state) {
      var result = new Promise((resolve, reject) => {
        !passInDoneCallback
          ? resolve(validator.call(this, value))
          : validator.call(this, value, (err, valid) => err ? reject(err) : resolve(valid))
      })

      return result
        .then(function(valid){
          if (!valid) 
            throw new ValidationError(errorMsg({ ...state, ...opts.params }))
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
    return has(overrides, key)
      ? overrides[key] : this._options[key]
  }
}

var aliases = {
  oneOf: ['equals']
}

for( var method in aliases ) if ( has(aliases, method) )
  aliases[method].forEach(
    alias => SchemaType.prototype[alias] = SchemaType.prototype[method])
  

SchemaType.create = function(spec){
  var Klass = this
  initProps = spec
  return new Klass();
}

SchemaType.extend = function(spec){
  var proto = Object.create(this.prototype)
    , child = spec.constructor;

  assign(child, this)
  assign(proto, spec)

  child.prototype = proto
  child.prototype.constructor = child
  return child
}

function merge(target, source){

  for (var key in source) if ( has(source, key)) {
    var targetVal = target[key]
    var sourceVal = source[key]

    if ( isObject(targetVal) || isObject(sourceVal) )
      target[key] = merge(targetVal, sourceVal)

    else if ( Array.isArray(targetVal) || Array.isArray(sourceVal))
      target[key] = sourceVal.concat 
        ? sourceVal.concat(targetVal) 
        : targetVal.concat(sourceVal);
    else
      target[key] = source[key];
  }
  
  return target;
}

function nodeify(promise, cb){
  if(typeof cb !== 'function') return promise

  promise.then(val => cb(null, val), err => cb(err))
}


function createCallback(resolve, reject){
  return (err, valid) => err ? reject(err) : resolve(valid)
}