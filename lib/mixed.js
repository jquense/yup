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
  this._options = {};
  this._activeTests = {};
  this._whitelist = new BadSet();
  this._blacklist = new BadSet();
  this.validations = [];
  this.transforms = [];

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
    return _.merge(this.clone(), schema.clone());
  },

  isType: function (value) {
    if (this._nullable && value === null) return true;
    return value !== undefined;
  },

  cast: function (_value, _opts) {
    var schema = this._resolve((_opts || {}).context);
    return schema._cast(_value, _opts);
  },

  _cast: function (_value) {
    var _this = this;

    var value = this._coerce ? this._coerce(_value) : _value;

    if (value === undefined && _.has(this, "_default")) value = this.default();

    return this.transforms.reduce(function (value, transform) {
      return transform.call(_this, value);
    }, value);
  },

  _resolve: function (context) {
    var schema = this;

    return this._conditions.reduce(function (schema, match) {
      if (!context) throw new Error("missing the context necessary to cast this value");
      return match.resolve(schema, getter(match.key)(context));
    }, schema);
  },

  //-- validations
  _validate: function (value, _opts, _state) {
    var valids = this._whitelist,
        invalids = this._blacklist,
        context = (_opts || {}).context || _state.parent,
        schema,
        valid,
        state,
        isStrict;

    state = _state;
    schema = this._resolve(context);
    isStrict = schema._option("strict", _opts);

    !state.path && (state.path = "this");

    var errors = [];

    if (!state.isCast && !isStrict) value = schema._cast(value, _opts);

    if (value !== undefined && !schema.isType(value)) {
      errors.push("value: " + value + " is must be a " + schema._type + " type");
      return Promise.reject(new ValidationError(errors));
    }

    if (valids.length) {
      valid = valids.has(value);

      if (!valid) return Promise.reject(new ValidationError(errors.concat(schema._whitelistError(babelHelpers._extends({ values: valids.values().join(", ") }, state)))));
    }

    if (invalids.has(value)) {
      return Promise.reject(new ValidationError(errors.concat(schema._blacklistError(babelHelpers._extends({ values: invalids.values().join(", ") }, state)))));
    }

    return Promise.all(schema.validations.map(function (fn) {
      return fn.call(schema, value, state);
    })).then(function () {
      if (errors.length) throw new ValidationError(errors);

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
    var _this = this;

    return this.validation({ hashKey: "required", message: msg || locale.required }, function (value) {
      return value !== undefined && _this.isType(value);
    });
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

  validation: function (msg, validator, passInDoneCallback) {
    var opts = msg,
        next = this.clone(),
        hashKey,
        errorMsg;

    if (typeof msg === "string") opts = { message: msg };

    if (next._whitelist.length) throw new TypeError("Cannot add validations when specific valid values are specified");

    errorMsg = interpolate(opts.message);
    hashKey = opts.hashKey;

    if (!hashKey || !_.has(next._activeTests, hashKey)) {
      if (hashKey) next._activeTests[hashKey] = true;
      next.validations.push(validate);
    }

    return next;

    function validate(value, state) {
      var _this = this;

      var result = new Promise(function (resolve, reject) {
        !passInDoneCallback ? resolve(validator.call(_this, value)) : validator.call(_this, value, function (err, valid) {
          return err ? reject(err) : resolve(valid);
        });
      });

      return result.then(function (valid) {
        if (!valid) throw new ValidationError(errorMsg(babelHelpers._extends({}, state, opts.params)));
      });
    }
  },

  when: function (key, options) {
    var next = this.clone();

    next._deps.push(key);
    next._conditions.push(new Condition(key, next, options));
    return next;
  },

  oneOf: function (enums, msg) {
    var next = this.clone();

    if (next.validations.length) throw new TypeError("Cannot specify values when there are validation rules specified");

    next._whitelistError = interpolate(msg || next._whitelistError || locale.oneOf);

    enums.forEach(function (val) {
      next._blacklist.delete(val);
      next._whitelist.add(val);
    });

    return next;
  },

  notOneOf: function (enums, msg) {
    var next = this.clone();

    next._blacklistError = interpolate(msg || next._blacklistError || locale.notOneOf);

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
});

function nodeify(promise, cb) {
  if (typeof cb !== "function") return promise;

  promise.then(function (val) {
    return cb(null, val);
  }, function (err) {
    return cb(err);
  });
}