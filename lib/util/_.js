'use strict';

var Promise = require('promise/lib/es6-extensions'),
    ValidationError = require('./validation-error');

var toString = Object.prototype.toString;

var isObject = function isObject(obj) {
  return obj && toString.call(obj) === '[object Object]';
};

var isPlainObject = function isPlainObject(obj) {
  return isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

var isDate = function isDate(obj) {
  return Object.prototype.toString.call(obj) === '[object Date]';
};

var isSchema = function isSchema(obj) {
  return obj && obj.__isYupSchema__;
};

function settled(promises) {
  var settle = function settle(promise) {
    return promise.then(function (value) {
      return { fulfilled: true, value: value };
    }, function (value) {
      return { fulfilled: false, value: value };
    });
  };

  return Promise.all(promises.map(settle));
}

function collectErrors(promises, value, path) {
  var errors = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

  // unwrap aggregate errors
  errors = errors.inner && errors.inner.length ? errors.inner : [].concat(errors);

  return settled(promises).then(function (results) {
    errors = results.reduce(function (arr, r) {
      return !r.fulfilled ? arr.concat(r.value) : arr;
    }, errors);

    if (errors.length) throw new ValidationError(errors, value, path);
  });
}

function assign(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (has(source, key)) target[key] = source[key];
    }
  }

  return target;
}

function uniq(arr, iter) {
  var seen = {};

  return arr.filter(function (item, idx) {
    var key = iter(item, idx);

    if (has(seen, key)) return false;
    return seen[key] = true;
  });
}

function transform(obj, cb, seed) {
  cb = cb.bind(null, seed = seed || (Array.isArray(obj) ? [] : {}));

  if (Array.isArray(obj)) obj.forEach(cb);else for (var key in obj) {
    if (has(obj, key)) cb(obj[key], key, obj);
  }return seed;
}

function merge(target, source) {
  for (var key in source) {
    if (has(source, key)) {
      var targetVal = target[key],
          sourceVal = source[key];

      if (sourceVal === undefined) continue;

      if (isSchema(sourceVal)) {
        target[key] = isSchema(targetVal) ? targetVal.concat(sourceVal) : sourceVal;
      } else if (isObject(sourceVal)) {
        target[key] = isObject(targetVal) ? merge(targetVal, sourceVal) : sourceVal;
      } else if (Array.isArray(sourceVal)) {
        target[key] = Array.isArray(targetVal) ? targetVal.concat(sourceVal) : sourceVal;
      } else target[key] = source[key];
    }
  }return target;
}

function has(o, k) {
  return o ? Object.prototype.hasOwnProperty.call(o, k) : false;
}

function inherits(ctor, superCtor, spec) {
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  assign(ctor.prototype, spec);
}

module.exports = {
  inherits: inherits, uniq: uniq, has: has,
  assign: assign, merge: merge, transform: transform,
  isSchema: isSchema, isObject: isObject, isPlainObject: isPlainObject, isDate: isDate,
  settled: settled, collectErrors: collectErrors
};