/* eslint-disable no-param-reassign */
import has from 'lodash/has';
import isArray from 'lodash/isArray';

import isSchema from './isSchema';

const isObject = obj => Object.prototype.toString.call(obj) === '[object Object]';

export default function merge(target, source) {
  Object.keys(source).forEach((key) => {
    if (!has(source, key)) {
      return;
    }

    const targetVal = target[key];
    const sourceVal = source[key];

    if (sourceVal === undefined) {
      return;
    }

    if (isSchema(sourceVal)) {
      target[key] = isSchema(targetVal)
        ? targetVal.concat(sourceVal)
        : sourceVal;
    } else if (isObject(sourceVal)) {
      target[key] = isObject(targetVal)
        ? merge(targetVal, sourceVal)
        : sourceVal;
    } else if (isArray(sourceVal)) {
      target[key] = isArray(targetVal)
        ? targetVal.concat(sourceVal)
        : sourceVal;
    } else {
      target[key] = source[key];
    }
  });

  return target;
}
