'use strict';
let { forEach } = require('property-expr')
  , { has } = require('./_');

let trim = part => part.substr(0, part.length - 1).substr(1)

module.exports = function (obj, path, value, context) {
  // if only one "value" arg then use it for both
  context = context || value;

  let parent, lastPart;

  forEach(path, (_part, isBracket, isArray) => {
    let part = isBracket ? trim(_part) : _part;

    if (isArray || has(obj, '_subType')) { // we skipped an array
      obj = obj._resolve(context, parent)._subType;
      value = value && value[0]
    }

    if (!isArray) {
      obj = obj._resolve(context, parent);

      if (!has(obj, 'fields'))
        throw new Error(
          `The schema does not contain the path: ${path}. ` +
          `(failed at: ${lastPart} which is a type: "${obj._type}") `
        )

      obj = obj.fields[part]
      parent = value;
      value = value && value[part]
      lastPart = isBracket ? '[' + _part + ']' : '.' + _part
    }
  })

  return obj._resolve(parent)
}
