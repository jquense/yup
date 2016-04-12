'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var MixedSchema = require('./mixed');
var Promise = require('promise/lib/es6-extensions');
var isAbsent = require('./util/isAbsent');

var _require = require('./locale.js');

var mixed = _require.mixed;
var locale = _require.array;

var _require2 = require('./util/_');

var inherits = _require2.inherits;
var collectErrors = _require2.collectErrors;


var scopeError = function scopeError(value) {
  return function (err) {
    err.value = value;
    throw err;
  };
};

var hasLength = function hasLength(value) {
  return !isAbsent(value) && value.length > 0;
};

module.exports = ArraySchema;

function ArraySchema(type) {
  var _this = this;

  if (!(this instanceof ArraySchema)) return new ArraySchema(type);

  MixedSchema.call(this, { type: 'array' });

  this._subType = null;

  this.withMutation(function () {
    _this.transform(function (values) {
      if (typeof values === 'string') try {
        values = JSON.parse(values);
      } catch (err) {
        values = null;
      }

      return this.isType(values) ? values : null;
    });

    if (type) _this.of(type);
  });
}

inherits(ArraySchema, MixedSchema, {
  _typeCheck: function _typeCheck(v) {
    return Array.isArray(v);
  },
  _cast: function _cast(_value, _opts) {
    var _this2 = this;

    var value = MixedSchema.prototype._cast.call(this, _value);

    //should ignore nulls here
    if (!this._typeCheck(value) || !this._subType) return value;

    return value.map(function (v) {
      return _this2._subType.cast(v, _opts);
    });
  },
  _validate: function _validate(_value, _opts, _state) {
    var errors = [],
        context,
        subType,
        schema,
        endEarly,
        recursive;

    _state = _state || {};
    context = _state.parent || (_opts || {}).context;
    schema = this._resolve(context);
    subType = schema._subType;
    endEarly = schema._option('abortEarly', _opts);
    recursive = schema._option('recursive', _opts);

    return MixedSchema.prototype._validate.call(this, _value, _opts, _state).catch(endEarly ? null : function (err) {
      errors = err;
      return err.value;
    }).then(function (value) {
      if (!recursive || !subType || !schema._typeCheck(value)) {
        if (errors.length) throw errors[0];
        return value;
      }

      var result = value.map(function (item, key) {
        var path = (_state.path || '') + '[' + key + ']',
            state = _extends({}, _state, { path: path, key: key, parent: value });

        return subType._validate(item, _opts, state);
      });

      result = endEarly ? Promise.all(result).catch(scopeError(value)) : collectErrors(result, value, _state.path, errors);

      return result.then(function () {
        return value;
      });
    });
  },
  of: function of(schema) {
    var next = this.clone();
    next._subType = schema;
    return next;
  },
  required: function required(msg) {
    var next = MixedSchema.prototype.required.call(this, msg || mixed.required);

    return next.test('required', msg || mixed.required, hasLength);
  },
  min: function min(_min, message) {
    message = message || locale.min;

    return this.test({
      message: message,
      name: 'min',
      exclusive: true,
      params: { min: _min },
      test: function test(value) {
        return isAbsent(value) || value.length >= this.resolve(_min);
      }
    });
  },
  max: function max(_max, message) {
    message = message || locale.max;
    return this.test({
      message: message,
      name: 'max',
      exclusive: true,
      params: { max: _max },
      test: function test(value) {
        return isAbsent(value) || value.length <= this.resolve(_max);
      }
    });
  },
  ensure: function ensure() {
    return this.default([]).transform(function (val) {
      return val != null ? [] : [].concat(val);
    });
  },
  compact: function compact(rejector) {
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