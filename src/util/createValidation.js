/* eslint-disable no-param-reassign */
import mapValues from 'lodash/mapValues';

import getPromise from './getPromise';
import Ref from '../Reference';
import ValidationError from '../ValidationError';

const formatError = ValidationError.formatError;

function resolveParams(oldParams, newParams, resolve) {
  return mapValues({ ...oldParams, ...newParams }, resolve);
}

function createErrorFactory({ value, label, resolve, originalValue, ...opts }) {
  return function createError({
    path = opts.path,
    message = opts.message,
    type = opts.name,
    params,
  } = {}) {
    params = {
      path,
      value,
      originalValue,
      label,
      ...resolveParams(opts.params, params, resolve),
    };

    return Object.assign(
      new ValidationError(
        formatError(message, params)
        , value
        , path
        , type,
      )
      , { params });
  };
}

export default function createValidation(options) {
  const { name, message, test, params } = options;

  function validate({
    value,
    path,
    label,
    options: validateOptions,
    sync: validateSync,
    originalValue,
    ...rest
  }) {
    const sync = options.sync || validateSync;
    const parent = validateOptions.parent;
    const resolve = val => (Ref.isRef(val) ? val.getValue(parent, validateOptions.context) : val);

    const createError = createErrorFactory({
      message,
      path,
      value,
      originalValue,
      params,
      label,
      resolve,
      name,
    });

    const ctx = {
      path,
      parent,
      type: name,
      createError,
      resolve,
      options: validateOptions,
      ...rest,
    };

    return getPromise(sync)
      .resolve(test.call(ctx, value))
      .then((validOrError) => {
        if (ValidationError.isError(validOrError)) {
          throw validOrError;
        } else if (!validOrError) {
          throw createError();
        }
      });
  }

  validate.TEST_NAME = name;
  validate.TEST_FN = test;
  validate.TEST = options;

  return validate;
}

module.exports.createErrorFactory = createErrorFactory;
