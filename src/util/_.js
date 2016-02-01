var Promise = require('promise/lib/es6-extensions')
  , ValidationError = require('./validation-error');

let toString = Object.prototype.toString

let isObject = obj => obj && toString.call(obj) === '[object Object]';

let isPlainObject = obj => isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;

let isDate = obj => Object.prototype.toString.call(obj) === '[object Date]'

let isSchema = obj => obj && obj.__isYupSchema__

function settled(promises){
  let settle = promise => promise.then(
    value => ({ fulfilled: true, value }),
    value => ({ fulfilled: false, value }))

  return Promise.all(promises.map(settle))
}

function collectErrors(promises, value, path, errors = []){
  // unwrap aggregate errors
  errors = errors.inner && errors.inner.length
    ? errors.inner : [].concat(errors)

  return settled(promises).then( results => {
    errors = results.reduce(
      (arr, r) => !r.fulfilled ? arr.concat(r.value) : arr, errors)

    if ( errors.length )
      throw new ValidationError(errors, value, path)
  })
}

function assign(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) if ( has(source, key))
      target[key] = source[key];
  }

  return target;
}

function uniq(arr, iter){
  var seen = {}

  return arr.filter( (item, idx) => {
    var key = iter(item, idx)

    if ( has(seen, key) ) return false
    return seen[key] = true
  })
}

function transform(obj, cb, seed){
  cb = cb.bind(null, seed = seed || (Array.isArray(obj) ? [] : {}))

  if( Array.isArray(obj))
    obj.forEach(cb)
  else
    for(var key in obj) if( has(obj, key) )
      cb(obj[key], key, obj)

  return seed
}

function merge(target, source){
  for (var key in source) if ( has(source, key)) {
    var targetVal = target[key]
      , sourceVal = source[key];

    if ( sourceVal === undefined )
      continue

    if ( isSchema(sourceVal) ) {
       target[key] = isSchema(targetVal)
        ? targetVal.concat(sourceVal)
        : sourceVal
    }
    else if ( isObject(sourceVal) ) {
      target[key] = isObject(targetVal)
        ? merge(targetVal, sourceVal)
        : sourceVal
    }
    else if ( Array.isArray(sourceVal) ) {
      target[key] = Array.isArray(targetVal)
        ? targetVal.concat(sourceVal)
        : sourceVal
    }
    else
      target[key] = source[key];
  }

  return target;
}

function has(o, k){
  return o ? Object.prototype.hasOwnProperty.call(o, k) : false
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

  assign(ctor.prototype, spec)
}

module.exports = {
  inherits, uniq, has,
  assign, merge, transform,
  isSchema, isObject, isPlainObject, isDate,
  settled, collectErrors
}
