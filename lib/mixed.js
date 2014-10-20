'use strict';
var interpolate = require('./util/interpolate')
  , Condition   = require('./util/condition')
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
          : _.isArray(val)
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
      if(_.isArray(a)) return a.concat(b)
    })
  },

  isType: function(value){
    if ( this._nullable && value === null ) return true
    return value !== undefined
  },

  cast: function(_value){
    var value  = this._coerce ? this._coerce(_value) : _value

    if( value == null && _.has(this, '_default') )
      value = this._nullable && value === null
        ? value
        : this.default()

    _.each(this.transforms, function(transform){
      value = transform.call(this, value)
    }, this)

    return value;
  },

  
  _resolve: function(_options, _state){
    var schema  = this
      , options = _options || this._options
      , context = (_state  || {}).parent || options.context;

    return _.reduce(this._conditions, function(schema, match){
      if(!context) throw new Error('missing the context necessary to cast this value')
      return match.resolve(schema, getter(match.key)(context), options, _state)
    }, schema)
  },

  //-- validations
  _validate: function(value, _options, _state) {
    var valids   = this._whitelist
      , invalids = this._blacklist
      , schema, isType, state, options;

    state  = _.defaults(_state, { path: 'this' })
    schema = this._resolve(_options, state)

    options = _.extend({}, schema._options, _options)
    this.errors = schema.errors = [];

    //console.log('req', schema)
    if( options.strict !== true )
      value = schema.cast(value)

    if ( value !== undefined && !schema.isType(value) ){
      schema.errors.push('value: ' + value + " is must be a " + schema._type + " type")
      return false
    }

    if( valids.length ) {
      var valid = has(valids, value)

      if( !valid ) schema.errors.push(
        schema._whitelistError(_.extend({ values: valids.join(', ') }, state)))
      return valid
    }

    if( has(invalids, value) ){
      schema.errors.push(
        schema._blacklistError(_.extend({ values: invalids.join(', ') }, state )))
      return false
    }

    var valid =  _.every(schema.validations, function(fn){
      return fn.call(schema, value, state)
    })

    this.errors = schema.errors.slice()
    return valid
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
    //console.log('validate')
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

  when: function(key, options){
    var next = this.clone();

    next._deps.push(key)
    //console.log('when: ', key, next, options)
    next._conditions.push(new Condition(key, next, options))

    return next
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


// function createConditionalCallback(ctx, val, _config){
//   var cb = config
//     , is, then, or;

//   if( typeof cb === 'function')
//     return cb

//   then = _config.then      ? ctx.concat(_config.then)      : ctx
//   or   = _config.otherwise ? ctx.concat(_config.otherwise) : ctx

//   is   = _config.is.__isYupSchema__ 
//     ? _config.is 
//     : { _validate: function(v){ 
//       return v === _config.is 
//     }}
  

//   return function(ref){
//       return is._validate(ref)
//         ? config.then
//         : config.otherwise
//     }

//   return 
// }

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

