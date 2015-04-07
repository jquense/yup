'use strict';
var SchemaObject = require('./mixed')
  , Promise = require('es6-promise').Promise
  , locale = require('./locale.js').object
  , transform = require('./util/transform')
  , assign = require('./util/assign')
  , cloneDeep = require('./util/clone')
  , has = require('./util/has')
  , Topo = require('./util/topo')
  , c = require('case');
  

var toString = Object.prototype.toString
var isObject = obj => obj && toString.call(obj) === '[object Object]';
var isPlainObject = obj => isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;

var _Object = module.exports = SchemaObject.extend({

  constructor(spec) {
    if ( !(this instanceof _Object))
      return new _Object(spec)

    this.fields = {};

    SchemaObject.call(this)

    this._type = 'object'

    this._initialDefault = () => {
      var dft = transform(this._nodes, (obj, key) => {
        var fieldDft = this.fields[key].default()
        if(fieldDft !== undefined ) obj[key] = fieldDft
      }, {})

      return Object.keys(dft).length === 0 ? undefined : dft
    }

    if ( spec )
      return this.shape(spec);
  },

  isType(value) {
    if( this._nullable && value === null) return true
    return value && typeof value === 'object' && !Array.isArray(value)
  },

  _coerce(value) {
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch (err){ value = null }
    }

    if( value === undefined || this.isType(value) )
      return value

    return null
  },

  _cast(_value, _opts) {
    var schema = this
      , value  = SchemaObject.prototype._cast.call(schema, _value)

    if( schema.isType(value) ) {
      var fields = schema.fields
        , strip  = schema._option('stripUnknown', _opts) === true
        , extra  = Object.keys(value).filter( v => schema._nodes.indexOf(v) === -1)
        , props  = schema._nodes.concat(extra)

      return transform(props, function(obj, prop) {
        var exists = has(value, prop);

        if( exists && fields[prop] )
          obj[prop] = fields[prop].cast(value[prop], { context: obj })

        else if( exists && !strip)
          obj[prop] = cloneDeep(value[prop])

        else if(fields[prop])
          obj[prop] = fields[prop].default()

      }, {})
    }

    return value
  },

  _validate(_value, _opts, _state) {
    var context, schema;

    _state  = _state || {}
    context = _state.parent || (_opts || {}).context
    schema  = this._resolve(context)

    return SchemaObject.prototype._validate
      .call(this, _value, _opts, _state)
      .then((value) => {
        if(!isObject(value)) // only iterate though actual objects
          return value

        return Promise
          .all(schema._nodes.map(function(key){
            var field = schema.fields[key]
              , path  = (_state.path ?  (_state.path + '.') : '') + key;
             
            return field._validate(value[key], _opts, { 
              ..._state, 
              key, 
              path, 
              parent: value 
            })
          }))
          .then(() => value)
      })
  },

  shape(schema) {
    var next = this.clone()
      , toposort = new Topo()
      , fields = assign(next.fields, schema);

    for( var key in schema ) if ( has(schema, key))
      toposort.add(key, { after: schema[key]._deps, group: key })

    next.fields = fields
    next._nodes = toposort.nodes
    return next
  },

  required(msg) {
    return this.validation(
      { hashKey: 'required',  message:  msg || locale.required },
      value => !!value && isPlainObject(value))
  },

  from(from, to, alias) {
    return this.transform(function(obj){
      var newObj = transform(obj, (o, val, key) => key !== from && (o[key] = val), {})

      newObj[to] = obj[from]
      if(alias) newObj[from] = obj[from]

      return newObj
    })
  },

  camelcase(){
    return this.transform(obj =>
      transform(obj, (newobj, val, key ) => newobj[c.camel(key)] = val))
  },

  constantcase(){
    return this.transform( obj =>
      transform(obj, (newobj, val, key ) => newobj[c.constant(key)] = val))
  }
})

