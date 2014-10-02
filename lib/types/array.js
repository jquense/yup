var SchemaObject = require('../schemaObject')
  , _ = require('lodash')


var _Array = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Array)) return new _Array()
    SchemaObject.call(this)

    this._type = 'array'

    if ( !_.has(this, '_default') )
      this._default = function(){ return [] }
  },

  isType: function(v) { 
    if( this._nullable && v === null) return true
    return _.isArray(v)
  },

  _coerce: function(values) {
    if (typeof values === 'string') {
      try { 
        values = JSON.parse(values)
      } catch (err){ values = null }
    }

    //console.log('hiiii', values)
    if(values == null ) return values
    if( this.isType(values) )
        return this._subType 
          ? _.map(values, this._subType.cast, this._subType)
          : values

    return null
  },

  isValid: function(value, opts){
    var subType = this._subType
      , valid = SchemaObject.prototype.isValid.call(this, value, opts);

    // check that the array values also are valid
    if ( valid && subType){
      opts = _.extend({}, this._options, opts)

      valid = _.every(value, function(item, key){
        var state = _.extend({}, opts, { key: key, path: (opts.path || '') + '['+ key + ']' })
        var valid = subType.isValid(item, state)
        
        if(!valid) this.errors = this.errors.concat(subType.errors)
        return valid
      }, this)
    }
      

    return valid
  },

  of: function(schema){
    var next = this.clone()
    next._subType = schema
    return next
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || '${name} field is required' },
      function(value){
        return value && this.isType(value) && !!value.length
      })
  },

  min: function(min, msg){
    msg = msg || '${name} field must have at least ${min} items'

    return this.validation(
        { message: msg, hashKey: 'min', params: { min: min } }
      , function(value){
          return value && value.length >= min
        })
  },

  max: function(max, msg){
    msg = msg || '${name} field must have less than ${max} items'
    return this.validation(
        { message: msg, hashKey: 'max', params: { max: max } }
      , function(value){
          return value && value.length <= max
        })
  },

  compact: function(){
    return this.transform(function(values){
      return _.compact(values)
    })
  }
})