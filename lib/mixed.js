'use strict';
var interpolate = require('./util/interpolate')
  , Promise = require('es6-promise').Promise
  , Condition   = require('./util/condition')
  , ValidationError = require('./util/validation-error')
  , getter = require('property-expr').getter
  , locale = require('./locale.js').mixed
  , _ = require('lodash')

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
  this._whitelist   = []
  this._blacklist   = []
  this.validations  = []
  this.transforms   = []

  _.extend(this, props)

  this._type        = 'mixed'
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone: function(){
    return this.constructor.create(
      _.transform(this, function(obj, val, key){
        obj[key] = val.clone
          ? val.clone()
          : Array.isArray(val)
            ? val.slice()
            : _.isPlainObject(val)
              ? _.clone(val)
              : val
      }, {})
    )
  },

  concat: function(schema){
    var next = this.clone()
    return _.merge(next, schema.clone(), function(a, b){
      if(Array.isArray(a)) return a.concat(b)
    })
  },

  isType: function(value){
    if ( this._nullable && value === null ) return true
    return value !== undefined
  },

  cast: function(_value, _opts){
    var schema = this._resolve((_opts|| {}).context)
    return schema._cast(_value, _opts)
  },

  _cast: function(_value, _opts){
    var self = this
      , value  = this._coerce ? this._coerce(_value) : _value

    if( value == null && _.has(self, '_default') )
      value = self._nullable && value === null
        ? value
        : self.default()

    return self.transforms.reduce(function(value, transform){
      return transform.call(self, value)
    }, value)
  },

  _resolve: function(context){
    var schema  = this;
    
    return this._conditions.reduce(function(schema, match){
      if(!context) throw new Error('missing the context necessary to cast this value')
      return match.resolve(schema, getter(match.key)(context))
    }, schema)
  },

  //-- validations
  _validate: function(value, _opts, _state) {
    var valids   = this._whitelist
      , invalids = this._blacklist
      , context  = (_opts || {}).context || _state.parent
      , schema, valid, state, isStrict;

    state    = _.defaults(_state || {}, { path: 'this' })
    schema   = this._resolve(context)
    isStrict = schema._option('strict', _opts)

    var errors = [];

    if( !state.isCast && !isStrict )
      value = schema._cast(value, _opts)

    if ( value !== undefined && !schema.isType(value) ){
      errors.push('value: ' + value + " is must be a " + schema._type + " type")
      return Promise.reject(new ValidationError(errors))
    }

    if( valids.length ) {
      valid = has(valids, value)

      if( !valid ) 
        return Promise.reject(new ValidationError(errors.concat(
            schema._whitelistError(_.extend({ values: valids.join(', ') }, state)))
          ))
    }

    if( has(invalids, value) ){
      return Promise.reject(new ValidationError(errors.concat(
          schema._blacklistError(_.extend({ values: invalids.join(', ') }, state ))
        )))
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

  default: function(def){
    if( arguments.length === 0)
      return _.result(this, '_default')

    var next = this.clone()
    next._default = def
    return next
  },

  strict(){
    var next = this.clone()
    next._options.strict = true
    return next
  },

  required(msg){
    return this.validation(
      { hashKey: 'required',  message:  msg || locale.required },
      function(value, params){
        return value !== undefined && this.isType(value)
      })
  },

  nullable(value){
    var next = this.clone()
    next._nullable = value === false ? false : true
    return next
  },

  transform(fn){
    var next = this.clone();
    next.transforms.push(fn)
    return next
  },

  validation(msg, fn, passInDoneCallback){
    var opts = msg
      , next = this.clone()
      , hashKey, errorMsg;

    if(typeof msg === 'string')
      opts = { message: msg }

    if( !!next._whitelist.length )
      throw new TypeError('Cannot add validations when specific valid values are specified')

    errorMsg = interpolate(opts.message)
    hashKey = opts.hashKey

    if( !hashKey || !_.has(next._activeTests, hashKey) ){
      if( hashKey ) next._activeTests[hashKey] = true
      next.validations.push(validate)
    }

    return next

    function validate(value, state) {
      var self = this, result;

      result = passInDoneCallback
        ? new Promise((resolve, reject) => fn.call(self, value, createCallback(resolve, reject)))
        : Promise.resolve(fn.call(this, value))

      return result
        .then(function(valid){
          if (!valid) 
            throw new ValidationError(errorMsg(_.extend({}, state, opts.params)))
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

    if( !!next.validations.length )
      throw new TypeError('Cannot specify values when there are validation rules specified')

    next._whitelistError = interpolate(msg || next._whitelistError || locale.oneOf)

    _.each(enums, function(val){
      remove(next._blacklist, val)
      add(next._whitelist, val)
    })
    return next
  },

  notOneOf: function(enums, msg) {
    var next = this.clone()

    next._blacklistError = interpolate(msg || next._blacklistError || locale.notOneOf)

    _.each(enums, function(val){
      remove(next._whitelist, val)
      add(next._blacklist, val)
    })
    return next
  },

  _option: function (key, overrides){
  	return _.has(overrides, key)
  		? overrides[key] : this._options[key]
	}
}

SchemaType.create = function(spec){
  var Klass = this
  initProps = spec
  return new Klass;
}

SchemaType.extend = function(spec){
  var proto = Object.create(this.prototype)
    , child = spec.constructor;

  _.extend(child, this)
  _.extend(proto, spec)

  child.prototype = proto
  child.prototype.constructor = child
  return child
}


function add(arr, item){
  if(typeof item === 'function' || (!Array.isArray(item) && _.isObject(item) ))
    throw new TypeError

  if(!has(arr, item)) arr.push(item)
}

function remove(arr, item){
  var idx = _.indexOf(arr, item)
  if( idx !== -1) arr.splice(idx, 1)
}

function has(arr, item){
  return _.any(arr, function(val){
    if (item === val) return true
    if( _.isDate(item) ) return +val === +item
    return false
  })
}

function nodeify(promise, cb){

  if(typeof cb !== 'function') 
    return promise

  promise
    .then(val => cb(null, val))
    .catch(err => cb(err))
    
}


function createCallback(resolve, reject){
  return function(err, valid){
    if (err) return reject(err)
    resolve(valid)
  }
}