/* eslint-disable no-param-reassign */
import has from 'lodash/has';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';

import isSchema from './isSchema';

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
    } else if (isPlainObject(sourceVal)) {
      target[key] = isPlainObject(targetVal)
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
