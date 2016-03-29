'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var MixedSchema = require('./mixed');
var Promise = require('promise/lib/es6-extensions');
var toposort = require('toposort');
var locale = require('./locale.js').object;
var split = require('property-expr').split;
var Ref = require('./util/reference');
var c = require('case');

var _require = require('./util/_');

var isObject = _require.isObject;
var transform = _require.transform;
var assign = _require.assign;
var inherits = _require.inherits;
var collectErrors = _require.collectErrors;
var isSchema = _require.isSchema;
var has = _require.has;

var isRecursive = function isRecursive(schema) {
  return (schema._subType || schema) === '$this';
};

c.type('altCamel', function (str) {
  var result = c.camel(str),
      idx = str.search(/[^_]/);

  return idx === 0 ? result : str.substr(0, idx) + result;
});

var childSchema = function childSchema(field, parent) {
  if (!isRecursive(field)) return field;

  return field.of ? field.of(parent) : parent;
};

var scopeError = function scopeError(value) {
  return function (err) {
    err.value = value;
    throw err;
  };
};

module.exports = ObjectSchema;

function ObjectSchema(spec) {
  var _this2 = this;

  if (!(this instanceof ObjectSchema)) return new ObjectSchema(spec);

  MixedSchema.call(this, { type: 'object', 'default': function _default() {
      var _this = this;

      var dft = transform(this._nodes, function (obj, key) {
        obj[key] = _this.fields[key]['default'] ? _this.fields[key]['default']() : undefined;
      }, {});

      return Object.keys(dft).length === 0 ? undefined : dft;
    }
  });

  this.withMutation(function () {
    _this2.transform(function coerce(value) {
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (err) {
          value = null;
        }
      }
      if (this.isType(value)) return value;
      return null;
    });
  });

  this.fields = Object.create(null);
  this._nodes = [];
  this._excludedEdges = [];

  if (spec) return this.shape(spec);
}

inherits(ObjectSchema, MixedSchema, {

  _typeCheck: function _typeCheck(value) {
    return isObject(value) || typeof value === 'function';
  },

  _cast: function _cast(_value) {
    var _opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var schema = this,
        value = MixedSchema.prototype._cast.call(schema, _value);

    //should ignore nulls here
    if (!schema._typeCheck(value)) return value;

    var fields = schema.fields,
        strip = schema._option('stripUnknown', _opts) === true,
        extra = Object.keys(value).filter(function (v) {
      return schema._nodes.indexOf(v) === -1;
    }),
        props = schema._nodes.concat(extra);

    schema.withMutation(function () {
      var innerOptions = _extends({}, _opts, { parent: {} });

      value = transform(props, function (obj, prop) {
        var field = fields[prop];
        var exists = has(value, prop);

        if (Ref.isRef(field)) {
          var refValue = field.getValue(obj, innerOptions.context);

          if (refValue !== undefined) obj[prop] = refValue;
        } else if (exists && field) {
          // ugly optimization avoiding a clone. clears default for recursive
          // cast and resets it below;
          var hasDflt = has(schema, '_default'),
              dflt = schema._default;

          var fieldSchema = childSchema(field, schema['default'](undefined));

          obj[prop] = fieldSchema.cast(value[prop], innerOptions);

          if (hasDflt) schema['default'](dflt);else delete schema._default;
        } else if (exists && !strip) obj[prop] = value[prop];else if (field) {
          var fieldDefault = field['default'] ? field['default']() : undefined;

          if (fieldDefault !== undefined) obj[prop] = fieldDefault;
        }
      }, innerOptions.parent);
    });

    return value;
  },

  _validate: function _validate(_value, _opts, _state) {
    var errors = [],
        state = _state || {},
        context,
        schema,
        endEarly,
        recursive;

    context = state.parent || (_opts || {}).context;
    schema = this._resolve(context);
    endEarly = schema._option('abortEarly', _opts);
    recursive = schema._option('recursive', _opts);

    return MixedSchema.prototype._validate.call(this, _value, _opts, state)['catch'](endEarly ? null : function (err) {
      errors.push(err);
      return err.value;
    }).then(function (value) {
      if (!recursive || !isObject(value)) {
        // only iterate though actual objects
        if (errors.length) throw errors[0];
        return value;
      }

      var result = schema._nodes.map(function (key) {
        var path = (state.path ? state.path + '.' : '') + key,
            field = childSchema(schema.fields[key], schema);

        return field._validate(value[key], _opts, _extends({}, state, { key: key, path: path, parent: value }));
      });

      result = endEarly ? Promise.all(result)['catch'](scopeError(value)) : collectErrors(result, value, state.path, errors);

      return result.then(function () {
        return value;
      });
    });
  },

  concat: function concat(schema) {
    var next = MixedSchema.prototype.concat.call(this, schema);

    next._nodes = sortFields(next.fields, next._excludedEdges);

    return next;
  },

  shape: function shape(schema) {
    var excludes = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

    var next = this.clone(),
        fields = assign(next.fields, schema);

    if (!Array.isArray(excludes[0])) excludes = [excludes];

    next.fields = fields;

    if (excludes.length) next._excludedEdges = next._excludedEdges.concat(excludes.map(function (v) {
      return v[0] + '-' + v[1];
    })); // 'node-othernode'

    next._nodes = sortFields(fields, next._excludedEdges);

    return next;
  },

  from: function from(_from, to, alias) {
    return this.transform(function (obj) {
      var newObj = obj;

      if (obj == null) return obj;

      if (has(obj, _from)) {
        newObj = transform(obj, function (o, val, key) {
          return key !== _from && (o[key] = val);
        }, {});
        newObj[to] = obj[_from];

        if (alias) newObj[_from] = obj[_from];
      }

      return newObj;
    });
  },

  noUnknown: function noUnknown() {
    var noAllow = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
    var message = arguments.length <= 1 || arguments[1] === undefined ? locale.noUnknown : arguments[1];

    if (typeof noAllow === 'string') message = noAllow, noAllow = true;

    var next = this.test({
      name: 'noUnknown',
      exclusive: true,
      message: message,
      test: function test(value) {
        return value == null || !noAllow || unknown(this.schema, value).length === 0;
      }
    });

    if (noAllow) next._options.stripUnknown = true;

    return next;
  },

  camelcase: function camelcase() {
    return this.transform(function (obj) {
      return obj == null ? obj : transform(obj, function (newobj, val, key) {
        return newobj[c.altCamel(key)] = val;
      });
    });
  },

  constantcase: function constantcase() {
    return this.transform(function (obj) {
      return obj == null ? obj : transform(obj, function (newobj, val, key) {
        return newobj[c.constant(key)] = val;
      });
    });
  }
});

function unknown(ctx, value) {
  var known = Object.keys(ctx.fields);
  return Object.keys(value).filter(function (key) {
    return known.indexOf(key) === -1;
  });
}

function sortFields(fields) {
  var excludes = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  var edges = [],
      nodes = [];

  for (var key in fields) if (has(fields, key)) {
    var value = fields[key];

    if (! ~nodes.indexOf(key)) nodes.push(key);

    var addNode = function addNode(depPath) {
      //eslint-disable-line no-loop-func
      var node = split(depPath)[0];

      if (! ~nodes.indexOf(node)) nodes.push(node);

      if (! ~excludes.indexOf(key + '-' + node)) edges.push([key, node]);
    };

    if (Ref.isRef(value) && !value.isContext) addNode(value.path);else if (isSchema(value)) value._deps.forEach(addNode);
  }

  return toposort.array(nodes, edges).reverse();
}