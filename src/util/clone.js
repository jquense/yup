// Copyright (c) 2011-2014, Walmart and other contributors.
// Copyright (c) 2011, Yahoo Inc.
// All rights reserved. https://github.com/hapijs/hoek/blob/master/LICENSE

var isSchema = schema => schema && !!schema.__isYupSchema__;

module.exports = function clone(obj, seen) {
  var isFirst = !seen
    , isImmutable = isSchema(obj) && !isFirst

  if (typeof obj !== 'object' || obj === null || isImmutable)
    return obj;

  // if (global.REPORT_CLONE && isFirst)
  //   throw new Error() //console.log('clone')

  seen = seen || { orig: [], copy: [] };

  var lookup = seen.orig.indexOf(obj);

  if (lookup !== -1)
    return seen.copy[lookup];

  var newObj;
  var cloneDeep = false;

  if (!Array.isArray(obj)) {
    if (obj instanceof Date) {
      newObj = new Date(obj.getTime());
    }
    else if (obj instanceof RegExp) {
      newObj = new RegExp(obj);
    }
    else {
      var proto = Object.getPrototypeOf(obj);

      if (proto !== null && !proto) {
        newObj = obj;
      }
      else {
        newObj = Object.create(proto);
        cloneDeep = true;
      }
    }
  }
  else {
    newObj = [];
    cloneDeep = true;
  }

  seen.orig.push(obj);
  seen.copy.push(newObj);

  if (cloneDeep) {
    var keys = Object.getOwnPropertyNames(obj);

    for (var i = 0, il = keys.length; i < il; ++i) {
      var key = keys[i];

      var descriptor = Object.getOwnPropertyDescriptor(obj, key);

      if (descriptor.get || descriptor.set) {
        Object.defineProperty(newObj, key, descriptor);
      }
      else {
        newObj[key] = clone(obj[key], seen);
      }
    }
  }

  return newObj;
}
