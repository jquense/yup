var Clank = require('clank')
  , _ = require('lodash')
  
var Resource = Clank.Object.extend({

  constructor: function Resource(){

  },

})

Resource.define = function(spec){
  
}

var variable = /\{\{\s*(\w+)\s*\}\}/g

Resource.define({

  url: '/api/artists/${id}/${artist.id}',

  schema: {
    id: 'name',

    validate: function(obj){
      return "uht o"
    },

    fields: {
      name: { type: String, validate: [ matches(/hge/,  'uht o ${regex}'), max(10), min(5) ] }
      arr:  [], //or Array
      tArr: field([ String ]),
      long: field(String, { idField: true, lazy: false, defaultValue: '' }),
      other: Resource({
        url: 
      })
    }
  }
})

