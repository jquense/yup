"use strict";
var babelHelpers = require("./util/babelHelpers.js");
var MixedSchema = require("./mixed");
var Promise = require("es6-promise").Promise;

var _require = require("./locale.js");

var mixed = _require.mixed;
var locale = _require.array;
var inherits = require("./util/_").inherits;

module.exports = ArraySchema;

function ArraySchema() {
  if (!(this instanceof ArraySchema)) return new ArraySchema();

  MixedSchema.call(this, { type: "array" });

  this.transforms.push(function (values) {
    if (typeof values === "string") try {
      values = JSON.parse(values);
    } catch (err) {
      values = null;
    }

    if (Array.isArray(values)) return this._subType ? values.map(this._subType.cast, this._subType) : values;

    return this.isType(values) ? values : null;
  });
}

inherits(ArraySchema, MixedSchema, {

  _typeCheck: function (v) {
    return Array.isArray(v);
  },

  _validate: function (_value, _opts, _state) {
    var context, subType, schema;

    _state = _state || {};
    context = _state.parent || (_opts || {}).context;
    schema = this._resolve(context);
    subType = schema._subType;

    return MixedSchema.prototype._validate.call(this, _value, _opts, _state).then(function (value) {

      if (!subType || !schema._typeCheck(value)) return value;

      return Promise.all(value.map(function (item, key) {
        var path = (_state.path || "") + "[" + key + "]",
            state = babelHelpers._extends({}, _state, { path: path, key: key, parent: value });

        return subType._validate(item, _opts, state);
      })).then(function () {
        return value;
      });
    });
  },

  of: function (schema) {
    var next = this.clone();
    next._subType = schema;
    return next;
  },

  required: function (msg) {
    return this.validation({ name: "required", exclusive: true, message: msg || mixed.required }, function (value) {
      return value && value.length > 0;
    });
  },

  min: function (min, msg) {
    msg = msg || locale.min;

    return this.validation({ message: msg, hashKey: "min", params: { min: min } }, function (value) {
      return value && value.length >= min;
    });
  },

  max: function (max, msg) {
    msg = msg || locale.max;
    return this.validation({ message: msg, hashKey: "max", params: { max: max } }, function (value) {
      return value && value.length <= max;
    });
  },

  compact: function (rejector) {
    var reject = !rejector ? function (v) {
      return !!v;
    } : function (v, i, a) {
      return !rejector(v, i, a);
    };

    return this.transform(function (values) {
      return values != null ? values.filter(reject) : values;
    });
  }
});