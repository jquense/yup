'use strict';
var MixedSchema = require('./mixed')
  , Promise = require('promise/lib/es6-extensions')
  //, Reference = require('./util/Reference')
  , cloneDeep = require('./util/clone')
  , toposort = require('toposort')
  , locale = require('./locale.js').object
  , split = require('property-expr').split
  , c = require('case')
  , {
    isObject
  , transform
  , assign
  , inherits
  , collectErrors
  , has } = require('./util/_');

let scopeError = value => err => {
      err.value = value
      throw err
    }

module.exports = ObjectSchema

function ObjectSchema(spec) {
  if ( !(this instanceof ObjectSchema))
      return new ObjectSchema(spec)

  MixedSchema.call(this, { type: 'object', default() {
      var dft = transform(this._nodes, (obj, key) => {
        obj[key] = this.fields[key].default ? this.fields[key].default() : undefined
      }, {})

      return Object.keys(dft).length === 0 ? undefined : dft
    }
  })

  this.transforms.push(function coerce(value) {
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value)
      }
      catch (err){ value = null }
    }

    if( this.isType(value) )
      return value

    return null
  })

  this.fields = Object.create(null)
  this._nodes = []
  this._excludedEdges = []

  if ( spec )
    return this.shape(spec);
}

inherits(ObjectSchema, MixedSchema, {

  _typeCheck(value) {
    return isObject(value) || typeof value === 'function';
  },

  _cast(_value, _opts) {
    var schema = this
      , value  = MixedSchema.prototype._cast.call(schema, _value)

    //should ignore nulls here
    if( schema._typeCheck(value) ) {
      var fields = schema.fields
        , strip  = schema._option('stripUnknown', _opts) === true
        , extra  = Object.keys(value).filter( v => schema._nodes.indexOf(v) === -1)
        , props  = schema._nodes.concat(extra)

      return transform(props, function(obj, prop) {
        var exists = has(value, prop);

        if( exists && fields[prop] ){
          var fieldSchema = fields[prop] === '$this' ? schema.default(undefined) : fields[prop]

          obj[prop] = fieldSchema.cast(value[prop], { context: obj })
        }

        else if( exists && !strip)
          obj[prop] = cloneDeep(value[prop])

        else if(fields[prop]){
          var fieldDefault = fields[prop].default ? fields[prop].default() : undefined

          if ( fieldDefault !== undefined)
            obj[prop] = fieldDefault
        }

      }, {})
    }

    return value
  },

// The issue with this is that there are two phases of validating a schema, transformation, and validation. They both work by processing a stack of transforms and validations, it is a very generic strategy which helps make yup a good bit smaller then joi and a lot more flexible in terms of doing custom stuff. The down side is that it doesn't leave a lot of room for tiny tweaks like this. `stripUnknown` is a transform
  _validate(_value, _opts, _state) {
    var errors = []
      , context, schema, endEarly, recursive;

    _state    = _state || {}
    context   = _state.parent || (_opts || {}).context
    schema    = this._resolve(context)
    endEarly  = schema._option('abortEarly', _opts)
    recursive = schema._option('recursive', _opts)

    return MixedSchema.prototype._validate
      .call(this, _value, _opts, _state)
      .catch(endEarly ? null : err => {
        errors.push(err)
        return err.value
      })
      .then(value => {
        if( !recursive || !isObject(value)) { // only iterate though actual objects
          if ( errors.length ) throw errors[0]
          return value
        }

        let result = schema._nodes.map(function(key){
          var field = schema.fields[key] === '$this' ? schema : schema.fields[key]
            , path  = (_state.path ?  (_state.path + '.') : '') + key;

          return field._validate(value[key]
            , _opts
            , { ..._state, key, path, parent: value  })
        })

        result = endEarly
          ? Promise.all(result).catch(scopeError(value))
          : collectErrors(result, value, _state.path, errors)

        return result.then(() => value)
      })


  },

  concat(schema){
    var next = MixedSchema.prototype.concat.call(this, schema)

    next._nodes = sortFields(next.fields, next._excludedEdges)

    return next
  },

  shape(schema, excludes = []) {
    var next = this.clone()
      , fields = assign(next.fields, schema);

    if ( !Array.isArray(excludes[0]))
      excludes = [excludes]

    next.fields = fields

    if ( excludes.length )
      next._excludedEdges = next._excludedEdges.concat(
        excludes.map(v => `${v[0]}-${v[1]}`)) // 'node-othernode'

    next._nodes = sortFields(fields, next._excludedEdges)

    return next
  },

  from(from, to, alias) {
    return this.transform( obj => {
      if ( obj == null)
        return obj

      var newObj = transform(obj, (o, val, key) => key !== from && (o[key] = val), {})

      newObj[to] = obj[from]
      if(alias) newObj[from] = obj[from]

      return newObj
    })
  },

  noUnknown(noAllow, message) {
    if ( typeof noAllow === 'string')
      message = noAllow, noAllow = true;

    var next = this.test({
      name: 'noUnknown',
      exclusive: true,
      message:  message || locale.noUnknown,
      test(value) {
        return value == null || !noAllow || unknown(this, value).length === 0
      }
    })

    if ( noAllow )
      this._options.stripUnknown = true

    return  next
  },

  camelcase(){
    return this.transform(obj => obj == null ? obj
      : transform(obj, (newobj, val, key ) => newobj[c.camel(key)] = val))
  },

  constantcase(){
    return this.transform( obj => obj == null ? obj
      : transform(obj, (newobj, val, key ) => newobj[c.constant(key)] = val))
  }
})

function unknown(ctx, value) {
  var known = Object.keys(ctx.fields)
  return Object.keys(value)
    .filter(key => known.indexOf(key) === -1)
}

function sortFields(fields, excludes = []){
  var edges = [], nodes = []

  for( var key in fields ) if ( has(fields, key)) {
    if ( !~nodes.indexOf(key) ) nodes.push(key)

    fields[key]._deps &&
      fields[key]._deps.forEach(node => {   //eslint-disable-line no-loop-func
        node = split(node)[0]

        if ( !~nodes.indexOf(node) )
          nodes.push(node)

        if ( !~excludes.indexOf(`${key}-${node}`) )
          edges.push([key, node])
      })
  }

  return toposort.array(nodes, edges).reverse()
}