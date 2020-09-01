import has from 'lodash/has';
import isSchema from './isSchema';

// function has<T extends {}, Key extends PropertyKey>
//   (obj: T, prop: Key): obj is T & Record<Key, unknown> {
//   return has(obj, prop)
// }

let isObject = (obj: any): obj is {} =>
  Object.prototype.toString.call(obj) === '[object Object]';

export default function merge(
  target: Record<PropertyKey, unknown>,
  source: Record<PropertyKey, unknown>,
) {
  for (let key in source)
    if (has(source, key)) {
      let sourceVal = source[key];
      let targetVal = (target as any)[key];

      if (targetVal === undefined) {
        target[key] = sourceVal;
      } else if (targetVal === sourceVal) {
        continue;
      } else if (isSchema(targetVal)) {
        if (isSchema(sourceVal)) target[key] = sourceVal.concat(targetVal);
      } else if (isObject(targetVal)) {
        if (isObject(sourceVal)) target[key] = merge(targetVal, sourceVal);
      } else if (Array.isArray(targetVal)) {
        if (Array.isArray(sourceVal)) target[key] = sourceVal.concat(targetVal);
      }
    }

  return target;
}
