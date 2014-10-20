'use strict';
var SchemaObject = require('./mixed')
  , locale = require('./locale.js').object
  , _ = require('lodash')
  , Case = require('case')
  , Topo = require('./util/topo')

var _Object = module.exports = SchemaObject.extend({

  constructor: function(spec){
    if ( !(this instanceof _Object))
      return new _Object(spec)

    if ( spec )
      return this.clone().shape(spec);

    this.fields = {};
    SchemaObject.call(this)

    this._type = 'object'
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
        , extra = _.without.apply(_, [_.keys(value)].concat(this._nodes))
        , props = this._nodes.concat(extra )

      console.log(props)

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
    var value = _value
      , opts, schema;

    schema = this._resolve(_opts, _state)
    opts   = _.extend({}, schema._options, _opts)

    //cast before validating so validations can use
    if( opts.strict !== true ){
      value = this.cast(value)
      opts.strict = true //don't re-cast later
    }

    if ( !SchemaObject.prototype._validate.call(this, value, opts, _state) )
      return false

    var valid = _.every(schema._nodes, function(key){
      var field = schema.fields[key]
        , path  = (_state.path ?  (_state.path + '.') : '') + key
        , state = _.defaults({ key: key, path: path, parent: value }, _state)
        , valid = field._validate(value[key], opts, state);

      if(!valid) schema.errors = schema.errors.concat(field.errors.slice())
      return valid
    })

    this.errors = schema.errors.slice()
    return valid
  },

  shape: function(schema){
    var next = this.clone()
      , toposort = new Topo()
      , fields = _.extend(next.fields, schema);

    _.each(fields, function(val, key){
      toposort.add(key, { after: val._deps, group: key })
    });

    next.fields = fields
    next._nodes = toposort.nodes
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

  camelcase: function(key){
    return this.transform(function(obj){

      return _.transform(obj, function(newobj, val, key ){
        newobj[Case.camel(key)] = val
      }, {})
    })
  },

  constantcase: function(key){
    return this.transform(function(obj){
      return _.transform(obj, function(newobj, val, key ){
        newobj[Case.constant(key)] = val
      }, {})
    })
  }
})