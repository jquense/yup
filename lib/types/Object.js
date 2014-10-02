
var SchemaObject = require('../schemaObject')
  , CastError = require('../errors/CastError')
  , _ = require('lodash')

var _Object = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Object)) return new _Object()
    this.fields = {};
    SchemaObject.call(this)

    this._type = 'object'

    if ( !_.has(this, '_default') )
      this._default = function(){ return {} }
  },

  isType: function(value){
    if( this._nullable && value === null) return true
    return value && typeof value === 'object' && !_.isArray(value)
  },

  _coerce: function(value) {
    if (typeof value === 'string') {
      try { 
        value = JSON.parse(value)
      } catch (err){ value = null }
    }

    if(value == null ) 
      return value

    if( this.isType(value) ) {
      var fields = this.fields
        , isStrict = this._options.strict === true 
        , props = _.union(_.keys(value), _.keys(fields))

      return _.transform(props, function(obj, prop) {
        var exists = _.has(value, prop);

        if( exists && fields[prop] )
            obj[prop] = fields[prop].cast(value[prop])

        else if( exists && !isStrict )
            obj[prop] = _.cloneDeep(value[prop])

        else if(fields[prop])
          obj[prop] = fields[prop].default() 

      }, {})
    }

    return null
  },

  shape: function(schema){
    var next = this.clone();

    next.fields = schema;
    return next
  },

  isValid: function(value, opts){
    var self = this;

    if ( !SchemaObject.prototype.isValid.call(this, value, opts) )
      return false

    opts = _.extend({}, this._options, opts);

    return _.every(this.fields, function(field, key){
      var state = _.extend({}, opts, { key: key, path: (opts.path ?  (opts.path + '.') : '') + key })
        , valid = field.isValid(value[key], state);

      if(!valid) self.errors = self.errors.concat(field.errors.slice())
      return valid
    })
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || '${name} field is required' },
      function(value, params){
        return  !!value && _.isPlainObject(value)
      })
  },

})

function mergeOptions(options, self){

}