
var toString = Object.prototype.toString;

var isObject = function (obj) {
  return obj && toString.call(obj) === "[object Object]";
};

var isPlainObject = function (obj) {
  return isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

var isDate = function (obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
};

function assign(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) if (has(source, key)) target[key] = source[key];
  }

  return target;
}

function transform(obj, cb, seed) {
  cb = cb.bind(null, seed = seed || (Array.isArray(obj) ? [] : {}));

  if (Array.isArray(obj)) obj.forEach(cb);else for (var key in obj) if (has(obj, key)) cb(obj[key], key, obj);

  return seed;
}

function merge(target, source) {
  for (var key in source) if (has(source, key)) {
    var targetVal = target[key];
    var sourceVal = source[key];

    if (isObject(targetVal) || isObject(sourceVal)) target[key] = merge(targetVal, sourceVal);else if (Array.isArray(targetVal) || Array.isArray(sourceVal)) target[key] = sourceVal.concat ? sourceVal.concat(targetVal) : targetVal.concat(sourceVal);else target[key] = source[key];
  }

  return target;
}

function has(o, k) {
  return o ? Object.prototype.hasOwnProperty.call(o, k) : false;
}

function inherits(ctor, superCtor, spec) {
  ctor.super_ = superCtor;
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
  inherits: inherits, has: has, assign: assign, merge: merge, transform: transform, isObject: isObject, isPlainObject: isPlainObject, isDate: isDate
};