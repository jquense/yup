var Clank = require('clank')
  , Field = require('./field')
  , fnName = require('fn-name')
  , fieldTypes = require('./fieldTypes')
  , Validation = require('./util/validators').validator
  , _ = require('lodash')
  
var Schema = module.exports = Clank.Object.extend({

  constructor: function Schema(spec){
    var self = this;

    Clank.Object.call(this)
    this.errors = []

    _.each(spec, function(val, key){
      if( _.isFunction(self[key]) ) self[key](val)
      else self[key] = val
    })
  },

  isValid: function(value) {
    var self = this
      , results;

    self.errors = []

    _.every(this.fields(), function(field, key){
      var valid = field.isValid(value[key])
      if(!valid) self.errors = self.errors.concat(field.errors.slice())
      return valid
    })

    if (this.validate){
      results = this.validate(value)
      results && this.errors.push(results)
    }

    return !this.errors.length
  },

  fields: function(fields){
    if ( arguments.length === 0) 
      return this._fields || {}

    this._fields = _.extend(
        this._fields || {}
      , _.mapValues(fields, function(val, key) {
          var type = val
            , is = _.has(type, 'type')
            , options = {}

          if ( val instanceof Field) return val

          if ( !type.type && _.isPlainObject(type) )
            return new Schema(type)

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
    
  options || (options = {});

  if( isArray ) {
    options.subField = fieldTypes[typeName(type[0])].create(options)
    type = 'Array'
  }

  if ( !_.isString(type) && !_.isFunction(type) ) 
    throw new TypeError()

  return  fieldTypes[typeName(type)].create(options)
}

function typeName(type) {
  if (type == null) return 'Mixed'
  if ( typeof type === 'function') return fnName(type)
  return type || 'Custom'
}

