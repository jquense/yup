'use strict';

var babelHelpers = require('./util/babelHelpers.js');

var MixedSchema = require('./mixed');
var Promise = require('promise/lib/es6-extensions');

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

module.exports = ArraySchema;

function ArraySchema() {
  if (!(this instanceof ArraySchema)) return new ArraySchema();

  MixedSchema.call(this, { type: 'array' });

  this.transforms.push(function (values) {
    if (typeof values === 'string') try {
      values = JSON.parse(values);
    } catch (err) {
      values = null;
    }

    if (Array.isArray(values)) return this._subType ? values.map(this._subType.cast, this._subType) : values;

    return this.isType(values) ? values : null;
  });
}

inherits(ArraySchema, MixedSchema, {

  _typeCheck: function _typeCheck(v) {
    return Array.isArray(v);
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

    return MixedSchema.prototype._validate.call(this, _value, _opts, _state)['catch'](endEarly ? null : function (err) {
      errors = err;
      return err.value;
    }).then(function (value) {
      if (!recursive || !subType || !schema._typeCheck(value)) {
        if (errors.length) throw errors[0];
        return value;
      }

      var result = value.map(function (item, key) {
        var path = (_state.path || '') + '[' + key + ']',
            state = babelHelpers._extends({}, _state, { path: path, key: key, parent: value });

        return subType._validate(item, _opts, state);
      });

      result = endEarly ? Promise.all(result)['catch'](scopeError(value)) : collectErrors(result, value, _state.path, errors);

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

    return next.min(1, msg || mixed.required);
  },

  min: (function (_min) {
    function min(_x, _x2) {
      return _min.apply(this, arguments);
    }

    min.toString = function () {
      return _min.toString();
    };

    return min;
  })(function (min, message) {
    message = message || locale.min;

    return this.test({
      message: message,
      name: 'min',
      exclusive: true,
      params: { min: min },
      test: function test(value) {
        return value && value.length >= min;
      }
    });
  }),

  max: (function (_max) {
    function max(_x3, _x4) {
      return _max.apply(this, arguments);
    }

    max.toString = function () {
      return _max.toString();
    };

    return max;
  })(function (max, message) {
    message = message || locale.max;
    return this.test({
      message: message,
      name: 'max',
      exclusive: true,
      params: { max: max },
      test: function test(value) {
        return value && value.length <= max;
      }
    });
  }),

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