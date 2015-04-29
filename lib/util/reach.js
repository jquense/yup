'use strict';

var _require = require('property-expr');

var forEach = _require.forEach;

var trim = function trim(part) {
  return part.substr(0, part.length - 1).substr(1);
};

module.exports = function (obj, path) {
  forEach(path, function (part, isBracket, isArray) {
    if (isArray) obj = obj._subType;else {
      if (obj._subType) // we skipped an array
        obj = obj._subType;

      obj = obj.fields[isBracket ? trim(part) : part];
    }
  });

  return obj;
};