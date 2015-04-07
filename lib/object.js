"use strict";
var babelHelpers = require("./util/babelHelpers.js");
var MixedSchema = require("./mixed");
var Promise = require("es6-promise").Promise;
var locale = require("./locale.js").object;
var cloneDeep = require("./util/clone");
var Topo = require("./util/topo");
var c = require("case");

var _require = require("./util/_");

var isObject = _require.isObject;
var isPlainObject = _require.isPlainObject;
var transform = _require.transform;
var assign = _require.assign;
var inherits = _require.inherits;
var has = _require.has;

module.exports = ObjectSchema;

function ObjectSchema(spec) {
  if (!(this instanceof ObjectSchema)) return new ObjectSchema(spec);

  MixedSchema.call(this, { type: "object", default: function () {
      var _this = this;

      var dft = transform(this._nodes, function (obj, key) {
        var fieldDft = _this.fields[key].default();
        if (fieldDft !== undefined) obj[key] = fieldDft;
      }, {});

      return Object.keys(dft).length === 0 ? undefined : dft;
    }
  });

  this.fields = Object.create(null);
  this._nodes = [];

  if (spec) return this.shape(spec);
}

inherits(ObjectSchema, MixedSchema, {

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
        value = MixedSchema.prototype._cast.call(schema, _value);

    if (schema.isType(value)) {
      var fields = schema.fields,
          strip = schema._option("stripUnknown", _opts) === true,
          extra = Object.keys(value).filter(function (v) {
        return schema._nodes.indexOf(v) === -1;
      }),
          props = schema._nodes.concat(extra);

      return transform(props, function (obj, prop) {
        var exists = has(value, prop);

        if (exists && fields[prop]) obj[prop] = fields[prop].cast(value[prop], { context: obj });else if (exists && !strip) obj[prop] = cloneDeep(value[prop]);else if (fields[prop]) {
          var fieldDefault = fields[prop].default();

          if (fieldDefault !== undefined) obj[prop] = fieldDefault;
        }
      }, {});
    }

    return value;
  },

  _validate: function (_value, _opts, _state) {
    var context, schema;

    _state = _state || {};
    context = _state.parent || (_opts || {}).context;
    schema = this._resolve(context);

    return MixedSchema.prototype._validate.call(this, _value, _opts, _state).then(function (value) {
      //console.log('validate ', value)
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