'use strict';

var _require = require('property-expr');

var forEach = _require.forEach;

var _require2 = require('./_');

var has = _require2.has;


var trim = function trim(part) {
  return part.substr(0, part.length - 1).substr(1);
};

module.exports = function (obj, path, value, context) {
  var parent = void 0,
      lastPart = void 0;

  // if only one "value" arg then use it for both
  context = context || value;

  forEach(path, function (_part, isBracket, isArray) {
    var part = isBracket ? trim(_part) : _part;

    if (isArray || has(obj, '_subType')) {
      // we skipped an array
      var idx = isArray ? parseInt(part, 10) : 0;
      obj = obj.resolve(context, parent, value)._subType;

      if (value) {

        if (isArray && idx >= value.length) {
          throw new Error('Yup.reach cannot resolve an array item at index: ' + _part + ', in the path: ' + path + '. ' + 'because there is no value at that index. ');
        }
        value = value[idx];
      }
    }

    if (!isArray) {
      obj = obj.resolve(context, parent, value);

      if (!has(obj, 'fields') || !has(obj.fields, part)) throw new Error('The schema does not contain the path: ' + path + '. ' + ('(failed at: ' + lastPart + ' which is a type: "' + obj._type + '") '));

      obj = obj.fields[part];

      parent = value;
      value = value && value[part];
      lastPart = isBracket ? '[' + _part + ']' : '.' + _part;
    }
  });

  return obj && obj.resolve(value, parent, value);
};