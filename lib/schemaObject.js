var Clank = require('clank')
  , interpolate = require('./util/interpolate')
  , _ = require('lodash')
  
var SchemaType = module.exports = Clank.Object.extend({

  __isMiniSchema__: true,

  constructor: function SchemaType(){
    if ( !(this instanceof SchemaType)) 
      return new SchemaType()

    this._options     = {}
    this._activeTests = {}
    this._whitelist   = []
    this._blacklist   = []
    this.validations  = []
    this.transforms   = []
    this_type         = 'mixed'
    Clank.Object.call(this)
  },

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

  isType: function(){ return true },

  cast: function(value){
    var value = this._coerce ? this._coerce(value, this._nullable) : value;

    _.each(this.transforms, function(transform){
      value = transform.call(this, value)
    }, this)

    return value;
  },

  //-- validations
  isValid: function(value, options) {
    var valids = this._whitelist
      , invalids = this._blacklist
      , isType, state;

    this.errors = [];
    options = _.extend({}, this._options, options)
    state   = _.pick(options, 'key', 'path')

    if( options.strict !== true )
      try {
        value = this.cast(value)
      } catch (err){ 
        this.errors.push(err.message)
        //console.log('catch', err)
        return false
      }
    
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
        this._blacklistError(_.extend({ values: valids.join(', ') }, state )))
      return false
    }  

    return _.every(this.validations, function(fn){
      return fn.call(this, value, state)
    }, this)
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

  // required: function(msg){
  //   var next = this.clone()
  //   next._required = true;
  //   next._requiredError = msg || '${key} field is required';
  //   return next
  // },

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

    next._whitelistError = interpolate(msg || next._whitelistError || '${path} must be one the following values: ${values}')

    _.each(enums, function(val){
      remove(next._blacklist, val)
      add(next._whitelist, val)
    })
    return next
  },

  notOneOf: function(enums, msg) {
    var next = this.clone()

    next._blacklistError = interpolate(msg || next._blacklistError || '${path} must not be one the following values: ${values}')

    _.each(enums, function(val){
      remove(next._whitelist, val)
      add(next._blacklist, val)
    })
    return next
  },
})

// function reqCheck(value, required,){
//   if ( required === 'nullable') //nullable ; null is valid value
//     return value === null || _.isNumber(value)

//   if(required === true)
//     return (value !== undefined && _.isNumber(value)) 
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

