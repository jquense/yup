'use strict';
/* global describe, it */
var SchemaObject = require('./mixed')
  , locale = require('./locale.js').object
  , _ = require('lodash')
  , Case = require('case')

var _Object = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Object)) return new _Object()
    this.fields = {};
    SchemaObject.call(this)

    this._type = 'object'

    // if ( !_.has(this, '_default') )
    //   this._default = function(){ return {} }
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

    if( this.isType(value) )
      return value

    return null
  },

  cast: function(_value){
    var value = SchemaObject.prototype.cast.call(this, _value)

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

    return value
  },

  _validate: function(_value, _opts, _state){
    var self = this
      , value = _value
      , opts = _.extend({}, this._options, _opts);

    //cast before validating so validations can use
    // if( opts.strict !== true ){
    //   value = this.cast(value)
    //   opts.strict = true //don't re-cast later
    // }

    if ( !SchemaObject.prototype._validate.call(this, value, opts, _state) )
      return false

    return _.every(this.fields, function(field, key){
      var path  = (_state.path ?  (_state.path + '.') : '') + key
        , state = _.defaults({ key: key, path: path }, _state)
        , valid = field._validate(value[key], opts, state);

      if(!valid) self.errors = self.errors.concat(field.errors.slice())
      return valid
    })
  },

  shape: function(schema){
    var next = this.clone();

    _.extend(next.fields, schema);
    return next
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || locale.required },
      function(value, params){
        return  !!value && _.isPlainObject(value)
      })
  },

  from: function(from, to, alias){
    return this.transform(function(obj){
      var newObj = _.omit(obj, from)

      newObj[to] = obj[from]
      if(alias) newObj[from] = obj[from]

      return newObj
    })
  },

  camelCase: function(key){
    return this.transform(function(obj){

      return _.transform(obj, function(newobj, val, key ){
        newobj[Case.camel(key)] = val
      }, {})
    })
  },

  constantCase: function(key){
    return this.transform(function(obj){
      return _.transform(obj, function(newobj, val, key ){
        newobj[Case.constant(key)] = val
      }, {})
    })
  }
})