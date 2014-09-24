var Clank = require('clank')
  , _ = require('lodash')
  , isoParse = require('./util/isodate')
  , AbstractField = require('./field');

module.exports = {

  "Object": AbstractField.extend({

    cast: _.identity,

    default: function(){ return {} },

    isValidValue: function(value){ return value != null }
  }),

  "Array": AbstractField.extend({

    cast: function(value){
      return _.map(values, this.subField.cast, this.subField)
    },

    default: function(){ return [] },

    isValidValue: function(value){
      return _.isArray(value ) && !!value.length
    }
  }),

  "String": AbstractField.extend({

    cast: function(value){
      return value == null ? '' : '' + value
    },

    default: function(){ return ''},

    isValidValue: function(value){
      return _.isString(value) && !!value.length
    }
  }),

  'Number': AbstractField.extend({

    cast: function(value){
      return _.isBoolean(value)
        ? value ? 1 : 0
        : value ? parseFloat(value) : 0
    },

    default: function(){ return 0 },

    isValidValue: _.isNumber

  }),

  'Boolean': AbstractField.extend({

    cast: function(value){
      return /true|1/i.test(value)
    },

    default: function(){ return false },

    isValidValue: _.isBoolean
  }),

  'Date': AbstractField.extend({

    cast: function(value){
      return new Date(isoParse(value))
    },

    default: function(){ return new Date },

    isValidValue: _.isDate   
  }),

  'Mixed': AbstractField.extend({
    cast: _.identity,

    default: function(){ return {} },

    isValidValue: function(value){ return value != null }
  }),

  'Custom': AbstractField.extend({

    cast: function(value){
      return value instanceof this.type 
        ? value 
        : this.type.create(value)
    },

    default: function(){ 
      return this.type.create() 
    },

    isValidValue: function(value){ 
      return value instanceof this.type 
    }
  })
}