"use strict";
var babelHelpers = require("./util/babelHelpers.js");
var MixedSchema = require("./mixed");
var Promise = require("es6-promise").Promise;

var _require = require("./locale.js");

var mixed = _require.mixed;
var locale = _require.array;

var _require2 = require("./util/_");

var inherits = _require2.inherits;

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
    var next = MixedSchema.prototype.required.call(this, msg || mixed.required);

    return next.min(1, msg || mixed.required);
  },

  min: function (min, message) {
    message = message || locale.min;

    return this.test({
      message: message,
      name: "min",
      exclusive: true,
      params: { min: min },
      test: function (value) {
        return value && value.length >= min;
      }
    });
  },

  max: function (max, message) {
    message = message || locale.max;
    return this.test({
      message: message,
      name: "max",
      exclusive: true,
      params: { max: max },
      test: function (value) {
        return value && value.length <= max;
      }
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