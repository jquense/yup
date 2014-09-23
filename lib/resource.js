var Clank = require('clank')
  , _ = require('lodash')
  
var Resource = Clank.Object.extend({

  constructor: function Resource(){

  },

})


Resource.define = function(spec){
  
}



schema: {
  name: String,
  arr:  [], //or Array
  tArr: field([ String ]),
  long: field(String, { idField: true, lazy: false, defaultValue: '' }),
  other: {
    lazy: false,
    type: Resource({
      url: 
    })
  }
}

function fnName(fn) {
  if ( fn.name ) return fn.name
  return fn.toString().match(/^\s*function\s*(\S*)\s*\(/)[1] 
}