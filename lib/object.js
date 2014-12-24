'use strict';
var SchemaObject = require('./mixed')
  , Promise = require('es6-promise').Promise
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
    return value && typeof value === 'object' && !Array.isArray(value)
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
        , strip  = schema._option('stripUnknown', _opts) === true
        , extra  = _.without.apply(_, [_.keys(value)].concat(schema._nodes))
        , props  = schema._nodes.concat(extra )

      //console.log(props)

      return _.transform(props, function(obj, prop) {
        var exists = _.has(value, prop);

        if( exists && fields[prop] )
          obj[prop] = fields[prop].cast(value[prop], { context: obj })

        else if( exists && !strip)
          obj[prop] = _.cloneDeep(value[prop])

        else if(fields[prop])
          obj[prop] = fields[prop].default()

      }, {})
    }

    return value
  },

  _validate: function(_value, _opts, _state){
    var context, schema;

    _state  = _state || {}
    context = _state.parent || (_opts || {}).context
    schema  = this._resolve(context)

    return SchemaObject.prototype._validate
      .call(this, _value, _opts, _state)
      .then((value) => {
        if(!_.isObject(value)) // only iterate though actual objects
          return value

        return Promise
          .all(schema._nodes.map(function(key){
            var field = schema.fields[key]
              , path  = (_state.path ?  (_state.path + '.') : '') + key;
             
             return field._validate(value[key], _opts
                    , _.defaults({ key, path, parent: value }, _state))
          }))
          .then(() => value)
      })
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

  return Object.keys(dft).length === 0 ? undefined : dft
}

