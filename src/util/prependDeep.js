import has from 'lodash/has';
import isSchema from './isSchema';

let isObject = obj => Object.prototype.toString.call(obj) === '[object Object]';

export default function prependDeep(target, source) {
  for (var key in source)
    if (has(source, key)) {
      var sourceVal = source[key],
        targetVal = target[key];

      if (targetVal === undefined) {
        target[key] = sourceVal;
      } else if (targetVal === sourceVal) {
        continue;
      } else if (isSchema(targetVal)) {
        if (isSchema(sourceVal)) target[key] = sourceVal.concat(targetVal);
      } else if (isObject(targetVal)) {
        if (isObject(sourceVal))
          target[key] = prependDeep(targetVal, sourceVal);
      } else if (Array.isArray(targetVal)) {
        if (Array.isArray(sourceVal)) target[key] = sourceVal.concat(targetVal);
      }
    }

  return target;
}
