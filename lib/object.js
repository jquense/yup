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

    if( value === undefined || this.isType(value) )
      return value

    return null
  },

  _cast: function(_value, _opts){
    var schema = this
      , value  = SchemaObject.prototype._cast.call(schema, _value)

    if( schema.isType(value) ) {
      var fields = schema.fields
        , strip  = _opts.stripUnknown === true
        , extra  = _.without.apply(_, [_.keys(value)].concat(schema._nodes))
        , props  = schema._nodes.concat(extra )

      //console.log(props)

      return _.transform(props, function(obj, prop) {
        var exists = _.has(value, prop);

        if( exists && fields[prop] )
          obj[prop] = fields[prop].cast(value[prop], obj, _opts)

        else if( exists && !strip )
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
      value = schema._cast(value, opts)
      opts.strict = true //don't re-cast later
    }

    if ( !SchemaObject.prototype._validate.call(schema, value, opts, _state) )
      return false

    if(!_.isObject(value))
      return true

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

  default: function(def){
    var hasDefault = _.has(this, '_default');

    if(def === undefined)
      return hasDefault
        ? SchemaObject.prototype.default.call(this)
        : createDefault(this.fields, this._nodes)

    return SchemaObject.prototype.default.call(this, def)
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

function createDefault(fields, nodes){

  var dft = _.transform(nodes, function(obj, key){
    var dft = fields[key].default()
    if(dft !== undefined ) obj[key] = dft
  }, {})

  return _.size(dft) === 0 ? undefined : dft
}