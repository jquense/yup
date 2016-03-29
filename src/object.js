'use strict';
var MixedSchema = require('./mixed')
  , Promise = require('promise/lib/es6-extensions')
  , toposort = require('toposort')
  , locale = require('./locale.js').object
  , split = require('property-expr').split
  , Ref = require('./util/reference')
  , c = require('case')
  , {
    isObject
  , transform
  , assign
  , inherits
  , collectErrors
  , isSchema, has } = require('./util/_');

let isRecursive = schema =>  (schema._subType || schema) === '$this'

c.type('altCamel', function(str) {
  let result = c.camel(str)
    , idx = str.search(/[^_]/)

  return idx === 0 ? result : (str.substr(0, idx) + result)
})

let childSchema = (field, parent) => {
  if (!isRecursive(field)) return field

  return field.of ? field.of(parent) : parent
}

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

  this.withMutation(() => {
    this.transform(function coerce(value) {
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value)
        }
        catch (err){ value = null }
      }
      if (this.isType(value))
        return value
      return null
    })
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

  _cast(_value, _opts = {}) {
    var schema = this
      , value  = MixedSchema.prototype._cast.call(schema, _value)

    //should ignore nulls here
    if (!schema._typeCheck(value))
      return value;

    var fields = schema.fields
      , strip  = schema._option('stripUnknown', _opts) === true
      , extra  = Object.keys(value).filter( v => schema._nodes.indexOf(v) === -1)
      , props  = schema._nodes.concat(extra);

    schema.withMutation(() => {
      let innerOptions = { ..._opts, parent: {} };



      value = transform(props, function(obj, prop) {
        let field = fields[prop]
        let exists = has(value, prop);

        if (Ref.isRef(field)) {
          let refValue = field.getValue(obj, innerOptions.context)

          if (refValue !== undefined)
            obj[prop] = refValue
        }
        else if (exists && field) {
          // ugly optimization avoiding a clone. clears default for recursive
          // cast and resets it below;
          let hasDflt = has(schema, '_default')
            , dflt = schema._default;

          let fieldSchema = childSchema(field, schema.default(undefined))

          obj[prop] = fieldSchema.cast(value[prop], innerOptions)

          if (hasDflt) schema.default(dflt)
          else delete schema._default
        }
        else if (exists && !strip)
          obj[prop] = value[prop]

        else if (field) {
          var fieldDefault = field.default ? field.default() : undefined

          if (fieldDefault !== undefined)
            obj[prop] = fieldDefault
        }
      }, innerOptions.parent)
    })

    return value
  },

  _validate(_value, _opts, _state) {
    var errors = []
      , state = _state || {}
      , context, schema
      , endEarly, recursive;

    context   = state.parent || (_opts || {}).context
    schema    = this._resolve(context)
    endEarly  = schema._option('abortEarly', _opts)
    recursive = schema._option('recursive', _opts)

    return MixedSchema.prototype._validate
      .call(this, _value, _opts, state)
      .catch(endEarly ? null : err => {
        errors.push(err)
        return err.value
      })
      .then(value => {
        if (!recursive || !isObject(value)) { // only iterate though actual objects
          if ( errors.length ) throw errors[0]
          return value
        }

        let result = schema._nodes.map(function(key) {
          var path  = (state.path ?  (state.path + '.') : '') + key
            , field = childSchema(schema.fields[key], schema)

          return field._validate(value[key]
            , _opts
            , { ...state, key, path, parent: value  })
        })

        result = endEarly
          ? Promise.all(result).catch(scopeError(value))
          : collectErrors(result, value, state.path, errors)

        return result.then(() => value)
      })
  },

  concat(schema) {
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
      var newObj = obj;

      if (obj == null)
        return obj

      if (has(obj, from)) {
        newObj = transform(obj, (o, val, key) => key !== from && (o[key] = val), {})
        newObj[to] = obj[from]

        if(alias) newObj[from] = obj[from]
      }

      return newObj
    })
  },

  noUnknown(noAllow = true, message = locale.noUnknown) {
    if (typeof noAllow === 'string')
      message = noAllow, noAllow = true;

    var next = this.test({
      name: 'noUnknown',
      exclusive: true,
      message: message,
      test(value) {
        return value == null || !noAllow || unknown(this.schema, value).length === 0
      }
    })

    if (noAllow)
      next._options.stripUnknown = true

    return next
  },

  camelcase(){
    return this.transform(obj => obj == null ? obj
      : transform(obj, (newobj, val, key ) => newobj[c.altCamel(key)] = val))
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

  for (var key in fields) if (has(fields, key)) {
    let value = fields[key];

    if (!~nodes.indexOf(key))
      nodes.push(key)

    let addNode = depPath => {   //eslint-disable-line no-loop-func
      var node = split(depPath)[0]

      if (!~nodes.indexOf(node))
        nodes.push(node)

      if (!~excludes.indexOf(`${key}-${node}`))
        edges.push([key, node])
    }

    if (Ref.isRef(value) && !value.isContext)
      addNode(value.path)
    else if (isSchema(value))
      value._deps.forEach(addNode)
  }

  return toposort.array(nodes, edges).reverse()
}
