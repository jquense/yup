var Clank = require('clank')
  , _ = require('lodash')
  , DAOObject = require('./dataAccessObject')
  , Schema = require('./schema')
  , interpolate = require('./util/interpolate')
  
var Resource = module.exports = DAOObject.extend({

  url: clank.required,
  
  prefix: 'models',

  id: clank.required,
  // constructor: function Resource(){

  // },

  getUrl: function(obj){
    var rTrailingSlash = /\/$/
      , url = this.url

    if( typeof this.url === 'string')
      url = interpolate(this.url)

    return url(obj || {}).replace(rTrailingSlash, '')
  },

  // idFor: function(obj){
  //   return obj[this.id]
  // },

  isNew: function(){
    return obj[this.id] === this.schema.defaultFor(this.id).default()
  }

  createRecord: function(obj){
    return this.schema.cast(obj)
  },

  save: function(record, options){
    var data = {}

    if( _.isArray(record), options.batch) {
      data[this.prefix] = record
    }
    else data = record


    return this.sync('POST', data, options || {})
  },

  saveMany: function(records, options){
    var self = this
      , created = []
      , updated = []
      , batch = options.batch !== false; 

    if(batch) {
      _.each(records, function(r){ 
        r = this.schema.cast(r)
        this.isNew(r) ? created.push(r) : updated.push(r) 
      }, this)

      return Promise.all([ 
        this.sync('POST', wrap(this.prefix, created), options),
        this.sync('PUT', wrap(this.prefix, updated), options ),
      ])
    }
      
    return Promise.map(records, function(record){
      return self.sync(self.isNew(record)? 'POST' : 'PUT', record, options ),
    })
  },

  sync: function(action, data, options){

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

function wrap(prefix, val){
  var obj = {}
  obj[prefix] = val
  return obj
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