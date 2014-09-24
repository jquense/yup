var Clank = require('clank')
  , _ = require('lodash')
  
module.exports = Clank.Object.extend({

  constructor: function Schema(spec){
    Clank.Object.call(this)

    _.extend(this, _.mapValues(spec, function(val, key) {
      var type = val, options = {}

      if (_.has(type, 'type') ){
        options = _.omit(type, 'type')
        type = type.type
      }

      return createField(type, options)
    }))
  },

  validate: function(){
    
  }
})


function createField(type, options){
  var isArray =  type === Array || _.isArray(type)
    , options = {};

  if ( !_.isString(type) && !_.isFunction(type) ) 
    throw new TypeError()

  if( isArray ) {
    options.subField = fieldTypes[typeName(type[0])].create(options)
    type = 'Array'
  }

  return fieldTypes[typeName(type)].create(options)
}


function typeName(type) {
  if (type == null) return 'Mixed'
  if ( typeof type === 'function') return fnName(type)
  return type || 'Custom'
}

