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
  tArr: [ String ],
  long: field(string, { idField: true }),
  other: {
    lazy: false,
    type: Resource({
      url: 
    })
  }
}