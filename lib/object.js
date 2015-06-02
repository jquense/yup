'use strict';

var babelHelpers = require('./util/babelHelpers.js');

var MixedSchema = require('./mixed');
var Promise = require('promise/lib/es6-extensions')
//, Reference = require('./util/Reference')
;var cloneDeep = require('./util/clone');
var toposort = require('toposort');
var locale = require('./locale.js').object;
var split = require('property-expr').split;
var c = require('case');

var _require = require('./util/_');

var isObject = _require.isObject;
var transform = _require.transform;
var assign = _require.assign;
var inherits = _require.inherits;
var collectErrors = _require.collectErrors;
var has = _require.has;

var scopeError = function scopeError(value) {
  return function (err) {
    err.value = value;
    throw err;
  };
};

module.exports = ObjectSchema;

function ObjectSchema(spec) {
  if (!(this instanceof ObjectSchema)) return new ObjectSchema(spec);

  MixedSchema.call(this, { type: 'object', 'default': function _default() {
      var _this = this;

      var dft = transform(this._nodes, function (obj, key) {
        obj[key] = _this.fields[key]['default'] ? _this.fields[key]['default']() : undefined;
      }, {});

      return Object.keys(dft).length === 0 ? undefined : dft;
    }
  });

  this.transforms.push(function coerce(value) {
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

  this.fields = Object.create(null);
  this._nodes = [];
  this._excludedEdges = [];

  if (spec) return this.shape(spec);
}

inherits(ObjectSchema, MixedSchema, {

  _typeCheck: function _typeCheck(value) {
    return isObject(value) || typeof value === 'function';
  },

  _cast: function _cast(_value, _opts) {
    var schema = this,
        value = MixedSchema.prototype._cast.call(schema, _value);

    //should ignore nulls here
    if (schema._typeCheck(value)) {
      var fields = schema.fields,
          strip = schema._option('stripUnknown', _opts) === true,
          extra = Object.keys(value).filter(function (v) {
        return schema._nodes.indexOf(v) === -1;
      }),
          props = schema._nodes.concat(extra);

      return transform(props, function (obj, prop) {
        var exists = has(value, prop);

        if (exists && fields[prop]) {
          var fieldSchema = fields[prop] === '$this' ? schema['default'](undefined) : fields[prop];

          obj[prop] = fieldSchema.cast(value[prop], { context: obj });
        } else if (exists && !strip) obj[prop] = cloneDeep(value[prop]);else if (fields[prop]) {
          var fieldDefault = fields[prop]['default'] ? fields[prop]['default']() : undefined;

          if (fieldDefault !== undefined) obj[prop] = fieldDefault;
        }
      }, {});
    }

    return value;
  },

  // The issue with this is that there are two phases of validating a schema, transformation, and validation. They both work by processing a stack of transforms and validations, it is a very generic strategy which helps make yup a good bit smaller then joi and a lot more flexible in terms of doing custom stuff. The down side is that it doesn't leave a lot of room for tiny tweaks like this. `stripUnknown` is a transform
  _validate: function _validate(_value, _opts, _state) {
    var errors = [],
        context,
        schema,
        endEarly;

    _state = _state || {};
    context = _state.parent || (_opts || {}).context;
    schema = this._resolve(context);
    endEarly = schema._option('abortEarly', _opts);

    return MixedSchema.prototype._validate.call(this, _value, _opts, _state)['catch'](endEarly ? null : function (err) {
      errors = err;
      return err.value;
    }).then(function (value) {
      if (!isObject(value)) {
        // only iterate though actual objects
        if (errors.length) throw errors[0];
        return value;
      }

      var result = schema._nodes.map(function (key) {
        var field = schema.fields[key] === '$this' ? schema : schema.fields[key],
            path = (_state.path ? _state.path + '.' : '') + key;

        return field._validate(value[key], _opts, babelHelpers._extends({}, _state, { key: key, path: path, parent: value }));
      });

      result = endEarly ? Promise.all(result)['catch'](scopeError(value)) : collectErrors(result, value, _state.path, errors);

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
    var excludes = arguments[1] === undefined ? [] : arguments[1];

    var next = this.clone(),
        fields = assign(next.fields, schema);

    if (!Array.isArray(excludes[0])) excludes = [excludes];

    next.fields = fields;

    next._excludedEdges = next._excludedEdges.concat(excludes.map(function (v) {
      return '' + v[0] + '-' + v[1];
    })); // 'node-othernode'

    next._nodes = sortFields(fields, next._excludedEdges);

    return next;
  },

  from: (function (_from) {
    function from(_x, _x2, _x3) {
      return _from.apply(this, arguments);
    }

    from.toString = function () {
      return _from.toString();
    };

    return from;
  })(function (from, to, alias) {
    return this.transform(function (obj) {
      if (obj == null) return obj;

      var newObj = transform(obj, function (o, val, key) {
        return key !== from && (o[key] = val);
      }, {});

      newObj[to] = obj[from];
      if (alias) newObj[from] = obj[from];

      return newObj;
    });
  }),

  noUnknown: function noUnknown(noAllow, message) {
    if (typeof noAllow === 'string') message = noAllow, noAllow = true;

    var next = this.test({
      name: 'noUnknown',
      exclusive: true,
      message: message || locale.noUnknown,
      test: function test(value) {
        return value == null || !noAllow || unknown(this, value).length === 0;
      }
    });

    if (!!noAllow) this._options.stripUnknown = true;

    return next;
  },

  camelcase: function camelcase() {
    return this.transform(function (obj) {
      return obj == null ? obj : transform(obj, function (newobj, val, key) {
        return newobj[c.camel(key)] = val;
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
  var excludes = arguments[1] === undefined ? [] : arguments[1];

  var edges = [],
      nodes = [];

  for (var key in fields) if (has(fields, key)) {
    if (! ~nodes.indexOf(key)) nodes.push(key);

    fields[key]._deps && fields[key]._deps.forEach(function (node) {
      //eslint-disable-line no-loop-func
      node = split(node)[0];

      if (! ~nodes.indexOf(node)) nodes.push(node);

      if (! ~excludes.indexOf('' + key + '-' + node)) edges.push([key, node]);
    });
  }

  return toposort.array(nodes, edges).reverse();
}