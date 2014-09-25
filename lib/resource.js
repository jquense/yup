var Clank = require('clank')
  , _ = require('lodash')
  , Schema = require('./schema')
  , interpolate = require('./util/interpolate')
  
var Resource = module.exports = Clank.Object.extend({

  url: '${urlRoot}/${id}',

  constructor: function Resource(){

  },

  getUrl: function(obj){
    var rTrailingSlash = /\/$/
      , url = this.url

    if( typeof this.url === 'string')
      url = interpolate(this.url)

    return url(obj).replace(rTrailingSlash, '')
  }

})


Resource.setCompositionStrategy({
  
  schema: new Clank.Descriptor(function(key, values) {
    var last = values[values.length -1]
    return Schema.create(last)
  })

})


Resource.define = function(spec){
  var proto = {};

  if( typeof spec.url === 'string') 
    proto.url = interpolate(sepc.url)  //now a function
}


// var variable = /\{\{\s*(\w+)\s*\}\}/g

// var UsersResource = Resource.extend({

//   url: '/api/artists/${id}',

//   schema: {
//     id: 'name',

//     validate: function(obj){
//       return "uht o"
//     },

//     fields: {
//       name: { type: String, validate: [ matches(/hge/,  'uht o ${regex}'), max(10), min(5) ] }
//       arr:  [], //or Array
//       tArr: field([ String ]),
//       long: field(String, { idField: true, lazy: false, defaultValue: '' }),
//       other: Resource({
//         url: 
//       })
//     }
//   }
// })

// var userResource = new UsersResource()
// UsersResource.All() // => [{}, {},{}]
// UsersResource.save(obj) // 
// var user = usersResource.create({ blah: blah})