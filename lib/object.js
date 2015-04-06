"use strict";
var babelHelpers = require("./util/babelHelpers.js");
var SchemaObject = require("./mixed"),
    Promise = require("es6-promise").Promise,
    locale = require("./locale.js").object,
    transform = require("./util/transform"),
    assign = require("./util/assign"),
    cloneDeep = require("./util/clone"),
    has = require("./util/has"),
    Topo = require("./util/topo"),
    c = require("case");

var toString = Object.prototype.toString;
var isObject = function (obj) {
  return obj && toString.call(obj) === "[object Object]";
};
var isPlainObject = function (obj) {
  return isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

var _Object = module.exports = SchemaObject.extend({

  constructor: function (spec) {
    if (!(this instanceof _Object)) return new _Object(spec);

    if (spec) return this.shape(spec);

    this.fields = {};
    SchemaObject.call(this);

    this._type = "object";
  },

  isType: function (value) {
    if (this._nullable && value === null) return true;
    return value && typeof value === "object" && !Array.isArray(value);
  },

  _coerce: function (value) {
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch (err) {
        value = null;
      }
    }

    if (value === undefined || this.isType(value)) return value;

    return null;
  },

  _cast: function (_value, _opts) {
    var schema = this,
        value = SchemaObject.prototype._cast.call(schema, _value);

    if (schema.isType(value)) {
      var fields = schema.fields,
          strip = schema._option("stripUnknown", _opts) === true,
          extra = Object.keys(value).filter(function (v) {
        return schema._nodes.indexOf(v) === -1;
      }),
          props = schema._nodes.concat(extra);

      return transform(props, function (obj, prop) {
        var exists = has(value, prop);

        if (exists && fields[prop]) obj[prop] = fields[prop].cast(value[prop], { context: obj });else if (exists && !strip) obj[prop] = cloneDeep(value[prop]);else if (fields[prop]) obj[prop] = fields[prop].default();
      }, {});
    }

    return value;
  },

  _validate: function (_value, _opts, _state) {
    var context, schema;

    _state = _state || {};
    context = _state.parent || (_opts || {}).context;
    schema = this._resolve(context);

    return SchemaObject.prototype._validate.call(this, _value, _opts, _state).then(function (value) {
      if (!isObject(value)) // only iterate though actual objects
        return value;

      return Promise.all(schema._nodes.map(function (key) {
        var field = schema.fields[key],
            path = (_state.path ? _state.path + "." : "") + key;

        return field._validate(value[key], _opts, babelHelpers._extends({}, _state, {
          key: key,
          path: path,
          parent: value
        }));
      })).then(function () {
        return value;
      });
    });
  },

  shape: function (schema) {
    var next = this.clone(),
        toposort = new Topo(),
        fields = assign(next.fields, schema);

    for (var key in schema) if (has(schema, key)) toposort.add(key, { after: schema[key]._deps, group: key });

    next.fields = fields;
    next._nodes = toposort.nodes;
    return next;
  },

  default: function (def) {
    var hasDefault = has(this, "_default");

    if (def === undefined) return hasDefault ? SchemaObject.prototype.default.call(this) : createDefault(this.fields, this._nodes);

    return SchemaObject.prototype.default.call(this, def);
  },

  required: function (msg) {
    return this.validation({ hashKey: "required", message: msg || locale.required }, function (value) {
      return !!value && isPlainObject(value);
    });
  },

  from: function (from, to, alias) {
    return this.transform(function (obj) {
      var newObj = transform(obj, function (o, val, key) {
        return key !== from && (o[key] = val);
      }, {});

      newObj[to] = obj[from];
      if (alias) newObj[from] = obj[from];

      return newObj;
    });
  },

  camelcase: function () {
    return this.transform(function (obj) {
      return transform(obj, function (newobj, val, key) {
        return newobj[c.camel(key)] = val;
      });
    });
  },

  constantcase: function () {
    return this.transform(function (obj) {
      return transform(obj, function (newobj, val, key) {
        return newobj[c.constant(key)] = val;
      });
    });
  }
});

function createDefault(fields, nodes) {

  var dft = transform(nodes, function (obj, key) {
    var dft = fields[key].default();
    if (dft !== undefined) obj[key] = dft;
  }, {});

  return Object.keys(dft).length === 0 ? undefined : dft;
}