var Clank = require('clank')
  , _ = require('lodash')
  
var defaultOptions = {
  lazy: false,
  defaultValue: null,
  nullable: true,
  idField: false,
}

module.exports = Clank.Object.extend({

  constructor: function AbstractField(){
    Clank.Object.call(this)
    _.defaults(this, defaultOptions)
  },

  cast: Clank.required,

  default: Clank.required

})



