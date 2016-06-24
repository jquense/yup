import has from 'lodash/has';
import isSchema from './isSchema';

let isObject = obj => Object.prototype.toString.call(obj) === '[object Object]';

export default function merge(target, source){
  for (var key in source) if (has(source, key)) {
    var targetVal = target[key]
      , sourceVal = source[key];

    if ( sourceVal === undefined )
      continue

    if (isSchema(sourceVal)) {
       target[key] = isSchema(targetVal)
        ? targetVal.concat(sourceVal)
        : sourceVal
    }
    else if (isObject(sourceVal)) {
      target[key] = isObject(targetVal)
        ? merge(targetVal, sourceVal)
        : sourceVal
    }
    else if (Array.isArray(sourceVal)) {
      target[key] = Array.isArray(targetVal)
        ? targetVal.concat(sourceVal)
        : sourceVal
    }
    else
      target[key] = source[key];
  }

  return target;
}
