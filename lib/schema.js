var Clank = require('clank')
  , Field = require('./field')
  , fieldTypes = require('./fieldTypes')
  , Validation = require('./util/validators').validator
  , _ = require('lodash')
  
module.exports = Clank.Object.extend({

  constructor: function Schema(spec){
    var self = this;

    Clank.Object.call(this)
    this.errors = []

    _.each(spec, function(val, key){
      if( _.isFunction(self[key]) ) self[key](val)
      else self[key] = val
    })
  },

  matches: function(value) {
    var self = this
      , results;

    self.errors = []

    results = _.every(this.fields(), function(field, key){
      var valid = field.validate(value[key])
      if(!valid) self.errors.push(field.errors.slice())
      return valid
    })

    if (results) {
      results = this.validate(value)

      results && this.errors.push(results)
      results = !results //invert
    }

    return results
  },

  fields: function(fields){
    if ( arguments.length === 0) 
      return this._fields || {}

    this._fields = _.extend(
        this._fields || {}
      , _.mapValues(fields, function(val, key) {
          var type = val, options = {}

          if ( val instanceof Field) return val

          if (_.has(type, 'type') ){
            options = _.omit(type, 'type')
            type = type.type
          }

          return createField(type, options)
        })
    )
  }
})


function createField(type, options){
  var isArray =  type === Array || _.isArray(type)
    , options = {};

  if ( !_.isString(type) && !_.isFunction(type) ) 
    throw new TypeError()

  if( isArray ) {
    options.subField = fieldTypes[typeName(type)[0]].create(options)
    type = 'Array'
  }

  return  fieldTypes[typeName(type)].create(options)
}


function typeName(type) {
  if (type == null) return 'Mixed'
  if ( typeof type === 'function') return fnName(type)
  return type || 'Custom'
}

