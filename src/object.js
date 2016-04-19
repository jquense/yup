'use strict';
var MixedSchema = require('./mixed')
  , Promise = require('universal-promise')
  , toposort = require('toposort')
  , locale = require('./locale.js').object
  , split = require('property-expr').split
  , Ref = require('./util/reference')
  , c = require('case')
  , {
    isObject
  , transform
  , inherits
  , collectErrors
  , isSchema, has } = require('./util/_');


c.type('altCamel', function(str) {
  let result = c.camel(str)
    , idx = str.search(/[^_]/)

  return idx === 0 ? result : (str.substr(0, idx) + result)
})


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

  this.fields = Object.create(null)
  this._nodes = []
  this._excludedEdges = []

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

    if (spec)
      this.shape(spec);
  })
}

inherits(ObjectSchema, MixedSchema, {

  _typeCheck(value) {
    return isObject(value) || typeof value === 'function';
  },

  _cast(_value, opts = {}) {
    var value = MixedSchema.prototype._cast.call(this, _value, opts)

    //should ignore nulls here
    if (value === undefined)
      return this.default();

    if (!this._typeCheck(value))
      return value;

    var fields = this.fields
      , strip  = this._option('stripUnknown', opts) === true
      , extra  = Object.keys(value).filter(v => this._nodes.indexOf(v) === -1)
      , props  = this._nodes.concat(extra);

    let innerOptions = { ...opts, parent: {} };

    value = transform(props, function(obj, prop) {
      let field = fields[prop]
      let exists = has(value, prop);

      if (field) {
        let fieldValue;

        if (field._strip === true)
          return

        fieldValue = field.cast(value[prop], innerOptions)

        if (fieldValue !== undefined)
          obj[prop] = fieldValue
      }
      else if (exists && !strip)
        obj[prop] = value[prop]

    }, innerOptions.parent)

    return value
  },

  _validate(_value, opts = {}) {
    var errors = []
      , endEarly, recursive;

    endEarly = this._option('abortEarly', opts)
    recursive = this._option('recursive', opts)

    return MixedSchema.prototype._validate
      .call(this, _value, opts)
      .catch(endEarly ? null : err => {
        errors.push(err)
        return err.value
      })
      .then(value => {
        if (!recursive || !isObject(value)) { // only iterate though actual objects
          if (errors.length) throw errors[0]
          return value
        }

        let result = this._nodes.map((key) => {
          var path  = (opts.path ?  (opts.path + '.') : '') + key
            , field = this.fields[key]
            , innerOptions = { ...opts, key, path, parent: value };

          if (field) {
            // inner fields are always strict:
            // 1. this isn't strict so we just cast the value leaving nested values already cast
            // 2. this is strict in which case the nested values weren't cast either
            innerOptions.strict = true;

            if (field.validate)
              return field.validate(value[key], innerOptions)
          }

          return true
        })

        result = endEarly
          ? Promise.all(result).catch(scopeError(value))
          : collectErrors(result, value, opts.path, errors)

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
      , fields = Object.assign(next.fields, schema);

    if (!Array.isArray(excludes[0]))
      excludes = [excludes]

    next.fields = fields

    if (excludes.length)
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

// ugly optimization avoiding a clone. clears default for recursive
// cast and resets it below;
// function tempClearDefault(schema, fn) {
//   let hasDflt = has(schema, '_default')
//     , dflt = schema._default;
//
//   fn(schema)
//
//   if (hasDflt) schema.default(dflt)
//   else delete schema._default
// }

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
