'use strict';
var interpolate = require('./util/interpolate')
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

  this._options     = {}
  this._activeTests = {}
  this._whitelist   = []
  this._blacklist   = []
  this.validations  = []
  this.transforms   = []
  this._type        = 'mixed'

  _.extend(this, props)
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone: function(){
    return this.constructor.create(
      _.transform(this, function(obj, val, key){
        obj[key] = _.isArray(val)
          ? val.slice()
          : _.isPlainObject(val)
            ? _.clone(val)
            : val
      }, {})
    )
  },

  isType: function(value){
    if ( this._nullable && value === null ) return true
    return value !== undefined
  },

  cast: function(_value){
    var value = this._coerce ? this._coerce(_value) : _value;

    if( value == null && _.has(this, '_default') )
      value = this._nullable && value === null
        ? value
        : this.default()

    _.each(this.transforms, function(transform){
      value = transform.call(this, value)
    }, this)

    return value;
  },

  //-- validations
  _validate: function(value, _options, _state) {
    var valids = this._whitelist
      , invalids = this._blacklist
      , isType, state, options;

    this.errors = [];
    options = _.extend({}, this._options, _options)
    state   = _.defaults(_state, { path: 'this' })

    if( options.strict !== true )
      value = this.cast(value)

    //console.log('req', value)
    if ( value !== undefined && !this.isType(value) ){
      this.errors.push('value: ' + value + " is must be a " + this._type + " type")
      return false
    }

    if( valids.length ) {
      var valid = has(valids, value)

      if( !valid ) this.errors.push(
        this._whitelistError(_.extend({ values: valids.join(', ') }, state)))
      return valid
    }

    if( has(invalids, value) ){
      this.errors.push(
        this._blacklistError(_.extend({ values: invalids.join(', ') }, state )))
      return false
    }

    return _.every(this.validations, function(fn){
      return fn.call(this, value, state)
    }, this)
  },

  isValid: function(value, options){
    return this._validate(value, options, {})
  },

  default: function (def){
    if( arguments.length === 0)
      return _.result(this, '_default')

    var next = this.clone()
    next._default = def
    return next
  },

  strict: function(){
    var next = this.clone()
    next._options.strict = true
    return next
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || locale.required },
      function(value, params){
        return value !== undefined && this.isType(value)
      })
  },

  nullable: function(value){
    var next = this.clone()
    next._nullable = value === false ? false : true
    return next
  },

  transform: function(fn){
    var next = this.clone();
    next.transforms.push(fn)
    return next
  },

  validation: function(msg, fn){
    var opts = msg
      , next = this.clone()
      , hashKey, error;

    if(typeof msg === 'string')
      opts = { message: msg }

    if( !!next._whitelist.length )
      throw new TypeError('Cannot add validations when specific valid values are specified')

    error = interpolate(opts.message)
    hashKey = opts.hashKey

    if( !hashKey || !_.has(next._activeTests, hashKey) ){
      if( hashKey ) next._activeTests[hashKey] = true
      next.validations.push(validate)
    }

    return next

    function validate(value, state) {
      var valid = fn.call(this, value)
      if(!valid) this.errors.push(error(_.extend({}, state, opts.params)))
      return valid
    }
  },

  oneOf: function(enums, msg) {
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
}

SchemaType.create = function(spec){
  initProps = spec
  return new this();
}

SchemaType.extend = function(spec){
  var base  = this
    , proto = Object.create(base.prototype)
    , child;

  _.extend(proto, spec)
  child = proto && _.has(proto, 'constructor')
        ? proto.constructor
        : function DefaultConstructor(){ return base.apply(this, arguments) }

  child.prototype = proto
  child.prototype.constructor = child
  _.extend(child, base);
  return child
}


function add(arr, item){
  if(_.isFunction(item) || (!_.isArray(item) && _.isObject(item) ))
    throw new TypeError

  if( !has(arr, item)) arr.push(item)
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

