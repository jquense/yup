import has from 'lodash/has';
import isSchema from './isSchema';

let isObject = obj => Object.prototype.toString.call(obj) === '[object Object]';

export default function merge(target, source) {
  for (var key in target)
    if (has(target, key)) {
      var targetVal = target[key],
        sourceVal = source[key];

      if (sourceVal === undefined) {
        source[key] = targetVal;
      } else if (isSchema(sourceVal)) {
        if (isSchema(targetVal)) source[key] = targetVal.concat(sourceVal);
      } else if (isObject(sourceVal)) {
        if (isObject(targetVal)) source[key] = merge(targetVal, sourceVal);
      } else if (Array.isArray(sourceVal)) {
        if (Array.isArray(targetVal)) source[key] = targetVal.concat(sourceVal);
      }
    }

  return source;
}
