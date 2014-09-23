var Clank = require('clank')
  , _ = require('lodash')
  , fnName = require('fn-name')
  , AbstractField = require('./field');

module.exports = {

  "Object": AbstractField.extend({

    cast: function(value){
      return value == null ? {} : _.clone(value)
    },

    default: function(){ return {} }
  }),

  "Array": AbstractField.extend({

    cast: function(value){
      return _.map(values, this.subField.cast, this.subField)
    },

    default: function(){ return [] }
  }),

  "String": AbstractField.extend({

    cast: function(value){
      return value == null ? '' : '' + value
    },

    default: function(){ return ''}
  }),

  'Number': AbstractField.extend({

    cast: function(value){
      return _.isBoolean(value)
        ? value ? 1 : 0
        : value ? parseFloat(value) : 0
    },

    default: function(){ return 0 }
  }),

  'Boolean': AbstractField.extend({

    cast: function(value){
      return /true|1/i.test(value)
    },

    default: function(){ return false }
  }),

  'Date': AbstractField.extend({

    cast: function(value){
      return new Date(value)
    },

    default: function(){ return new Date }   
  }),

  'Mixed': AbstractField.extend({
    cast: _.identity
  }),

  'Custom': AbstractField.extend({

    cast: function(value){
      return value instanceof this.type 
        ? value 
        : this.type.create(value)
    },

    default: function(){ 
      return this.type.create() 
    }
  })
}


function typeName(type) {
  if (type == null) return 'Mixed'
  if ( typeof type === 'function') return fnName(type)
  return type || 'Custom'
}
