"use strict";
var babelHelpers = require("./util/babelHelpers.js");
var interpolate = require("./util/interpolate"),
    Promise = require("es6-promise").Promise,
    Condition = require("./util/condition"),
    ValidationError = require("./util/validation-error"),
    getter = require("property-expr").getter,
    locale = require("./locale.js").mixed,
    _ = require("./util/_"),
    cloneDeep = require("./util/clone"),
    BadSet = require("./util/set");

module.exports = SchemaType;

function SchemaType() {
  var options = arguments[0] === undefined ? {} : arguments[0];

  if (!(this instanceof SchemaType)) return new SchemaType();

  this._deps = [];
  this._conditions = [];
  this._options = { abortEarly: true };
  this._exclusive = Object.create(null);
  this._whitelist = new BadSet();
  this._blacklist = new BadSet();
  this.tests = [];
  this.transforms = [];
  this._typeError = interpolate(locale.notType);

  if (_.has(options, "default")) this._default = options.default;

  this._type = options.type || "mixed";
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone: function () {
    return cloneDeep(this);
  },

  concat: function (schema) {
    if (!schema) return this;

    if (schema._type !== this._type) throw new TypeError("You cannot `concat()` schema's of different types: " + this._type + " and " + schema._type);

    var next = _.merge(this.clone(), schema.clone());

    // undefined isn't merged over, but is a valid value for default
    if (schema._default === undefined && _.has(schema, "_default")) next._default = schema._default;

    // trim exclusive tests, take the most recent ones
    next.tests = _.uniq(next.tests.reverse(), function (fn, idx) {
      return next[fn.VALIDATION_KEY] ? fn.VALIDATION_KEY : idx;
    }).reverse();

    return next;
  },

  isType: function (v) {
    if (this._nullable && v === null) return true;
    return !this._typeCheck || this._typeCheck(v);
  },

  cast: function (_value, _opts) {
    var schema = this._resolve((_opts || {}).context);
    return schema._cast(_value, _opts);
  },

  _cast: function (_value) {
    var _this = this;

    var value = _value === undefined ? _value : this.transforms.reduce(function (value, transform) {
      return transform.call(_this, value, _value);
    }, _value);

    if (value === undefined && _.has(this, "_default")) value = this.default();

    return value;
  },

  _resolve: function (context) {
    var schema = this;

    return this._conditions.reduce(function (schema, match) {
      if (!context) throw new Error("missing the context necessary to cast this value");
      return match.resolve(schema, getter(match.key)(context));
    }, schema);
  },

  //-- tests
  _validate: function (value, _opts, _state) {
    var valids = this._whitelist,
        invalids = this._blacklist,
        context = (_opts || {}).context || _state.parent,
        schema = undefined,
        state = undefined,
        endEarly = undefined,
        isStrict = undefined;

    state = _state;
    schema = this._resolve(context);
    isStrict = schema._option("strict", _opts);
    endEarly = schema._option("abortEarly", _opts);

    !state.path && (state.path = "this");

    var errors = [];
    var reject = function () {
      return Promise.reject(new ValidationError(errors));
    };

    if (!state.isCast && !isStrict) value = schema._cast(value, _opts);

    if (value !== undefined && !schema.isType(value)) {
      errors.push(schema._typeError({ value: value, type: schema._type, path: state.path }));
      if (endEarly) return reject();
    }

    if (valids.length && !valids.has(value)) {
      errors.push(schema._whitelistError(valids.values(), state.path));
      if (endEarly) return reject();
    }

    if (invalids.has(value)) {
      errors.push(schema._blacklistError(invalids.values(), state.path));
      if (endEarly) return reject();
    }

    // It makes no sense to validate further at this point
    if (errors.length) return reject();

    var result = schema.tests.map(function (fn) {
      return fn.call(schema, value, state);
    });

    result = endEarly ? Promise.all(result) : _.settled(result).then(function (results) {
      var errors = results.reduce(function (arr, r) {
        return !r.fulfilled ? arr.concat([r.value.errors]) : arr;
      }, []);

      if (errors.length) throw new ValidationError(errors);
    });

    return result.then(function () {
      return value;
    });
  },

  validate: function (value, options, cb) {
    if (typeof options === "function") cb = options, options = {};

    return nodeify(this._validate(value, options, {}), cb);
  },

  isValid: function (value, options, cb) {
    if (typeof options === "function") cb = options, options = {};

    return nodeify(this.validate(value, options).then(function () {
      return true;
    }).catch(function (err) {
      if (err instanceof ValidationError) return false;
      throw err;
    }), cb);
  },

  default: function (def) {
    if (arguments.length === 0) {
      var dflt = this._default;
      return typeof dflt === "function" ? dflt.call(this) : cloneDeep(dflt);
    }

    var next = this.clone();
    next._default = def;
    return next;
  },

  strict: function () {
    var next = this.clone();
    next._options.strict = true;
    return next;
  },

  required: function (msg) {
    return this.test({
      name: "required",
      exclusive: true,
      message: msg || locale.required,
      test: function (value) {
        return value != null;
      }
    });
  },

  typeError: function (msg) {
    var next = this.clone();
    next._typeError = interpolate(msg);
    return next;
  },

  nullable: function (value) {
    var next = this.clone();
    next._nullable = value === false ? false : true;
    return next;
  },

  transform: function (fn) {
    var next = this.clone();
    next.transforms.push(fn);
    return next;
  },

  test: function (name, message, test, useCallback) {
    var opts = name,
        next = this.clone(),
        errorMsg,
        isExclusive;

    if (typeof name === "string") opts = { name: name, test: test, message: message, useCallback: useCallback, exclusive: false };

    if (next._whitelist.length) throw new TypeError("Cannot add tests when specific valid values are specified");

    errorMsg = interpolate(opts.message);
    isExclusive = opts.name && next._exclusive[opts.name] === true;

    if (opts.exclusive) {
      if (!opts.name) throw new TypeError("You cannot have an exclusive validation without a name to identify it");

      next._exclusive[opts.name] = true;
      validate.VALIDATION_KEY = opts.name;
    }

    if (isExclusive) next.tests = next.tests.filter(function (fn) {
      return fn.VALIDATION_KEY !== opts.name;
    });

    next.tests.push(validate);

    return next;

    function validate(value, state) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        !opts.useCallback ? resolve(opts.test.call(_this, value)) : opts.test.call(_this, value, function (err, valid) {
          return err ? reject(err) : resolve(valid);
        });
      }).then(function (valid) {
        if (!valid) throw new ValidationError(errorMsg(babelHelpers._extends({ path: state.path }, opts.params)));
      });
    }
  },

  when: function (key, options) {
    var next = this.clone();

    next._deps.push(key);
    next._conditions.push(new Condition(key, next._type, options));
    return next;
  },

  oneOf: function (enums, msg) {
    var next = this.clone();

    if (next.tests.length) throw new TypeError("Cannot specify values when there are validation rules specified");

    next._whitelistError = function (valids, path) {
      return interpolate(msg || locale.oneOf, { values: valids.join(", "), path: path });
    };

    enums.forEach(function (val) {
      next._blacklist.delete(val);
      next._whitelist.add(val);
    });

    return next;
  },

  notOneOf: function (enums, msg) {
    var next = this.clone();

    next._blacklistError = function (invalids, path) {
      return interpolate(msg || locale.notOneOf, { values: invalids.join(", "), path: path });
    };

    enums.forEach(function (val) {
      next._whitelist.delete(val);
      next._blacklist.add(val);
    });

    return next;
  },

  _option: function (key, overrides) {
    return _.has(overrides, key) ? overrides[key] : this._options[key];
  }
};

var aliases = {
  oneOf: ["equals"]
};

for (var method in aliases) if (_.has(aliases, method)) aliases[method].forEach(function (alias) {
  return SchemaType.prototype[alias] = SchemaType.prototype[method];
}); //eslint-disable-line no-loop-func

function nodeify(promise, cb) {
  if (typeof cb !== "function") return promise;

  promise.then(function (val) {
    return cb(null, val);
  }, function (err) {
    return cb(err);
  });
}