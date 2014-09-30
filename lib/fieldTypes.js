var Clank = require('clank')
  , _ = require('lodash')
  , isoParse = require('./util/isodate')
  , AbstractField = require('./field');

module.exports = {

  // "Object": AbstractField.extend({

  //   cast: _.identity,

  //   default: function(){ return {} },

  //   required: function(value){ return value != null }
  // }),

  "Array": AbstractField.extend({

    cast: function(values){

      if(_.isArray(values))
        return _.map(values, this.subField.cast, this.subField)

      throw new CastError
    },

    default: function(){ return [] },

    required: function(value){
      return _.isArray(value) && !!value.length
    },

    isValid: function(value, key){
      var subField = this.subField
        , valid = AbstractField.prototype.isValid.call(this, value, key)

      // check that the array values also are valid
      if ( valid && subField)
        valid = _.every(value, function(item){
          valid = subField.isValid(item, key)
          if(!valid) this.errors = this.errors.concat(subField.errors)
          return valid
        }, this)

      return valid
    },

    min: function(val, min){ 
      return _.isArray(value) && val.length >= min
    },

    max: function(val, max){
      return _.isArray(value) && val.length <= max
    },

    range: function(val, min, max){
      return this.min(val, min) && this.max(val, max)
    }
  }),

  "String": AbstractField.extend({

    cast: function(value){
      return value == null ? '' : '' + value
    },

    default: function(){ return ''},

    required: function(value){
      return _.isString(value) && !!value.length
    },

    min: function(val, min){ 
      return this.cast(val).length >= min
    },

    max: function(val, max){
      return this.cast(val).length <= max
    },

    range: function(val, min, max){
      return this.min(val, min) && this.max(val, max)
    },

    
  }),

  'Number': AbstractField.extend({

    cast: function(value){
      if ( this.required(value) ) return value

      return _.isBoolean(value)
        ? value ? 1 : 0
        : value ? parseFloat(value) : 0
    },

    default: function(){ return 0 },

    required: _.isNumber,

    min: function(val, min){ 
      return this.cast(val) >= min
    },

    max: function(val, max){
      return this.cast(val) <= max
    },

    range: function(val, min, max){
      return this.min(val, min) && this.max(val, max)
    },

  }),

  'Boolean': AbstractField.extend({

    cast: function(value){
      if ( this.required(value) ) return value
      return /true|1/i.test(value)
    },

    default: function(){ return false },

    required: _.isBoolean
  }),

  'Date': AbstractField.extend({

    cast: function(value){
      if ( this.required(value) ) return value
      return new Date(isoParse(value))
    },

    default: function(){ return new Date },

    required: _.isDate,

    min: function(val, min){ 
      return this.cast(val) >= this.cast(min)
    },

    max: function(val, max){
      return this.cast(val) <= this.cast(max)
    },

    range: function(val, min, max){
      return this.min(val, min) && this.max(val, max)
    }
  }),

  'Mixed': AbstractField.extend({
    cast: _.identity,

    default: function(){ return {} },

    required: function(value){ return value != null }
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

    required: function(value){ 
      return value instanceof this.type 
    }
  }),

  'Resource': AbstractField.extend({

    cast: function(value){
      return value instanceof this.type 
        ? value 
        : this.type.create(value)
    },

    default: function(){ 
      return this.type.create() 
    },

    required: function(value){ 
      return value instanceof this.type 
    }
  })
}