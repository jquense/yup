import Promise from 'universal-promise'
import mapValues from 'lodash/mapValues';
import ValidationError from '../ValidationError'
import Ref from '../Reference'

let formatError = ValidationError.formatError

function resolveParams(oldParams, newParams, resolve) {
  return mapValues({ ...oldParams, ...newParams }, resolve)
}

function createErrorFactory({ value, label, resolve, ...opts}) {
  return function createError({ path = opts.path, message = opts.message, type = opts.name, params } = {}) {
    params = { path, value, label, ...resolveParams(opts.params, params, resolve) };

    return Object.assign(new ValidationError(
        typeof message ==='string' ? formatError(message, params) : message
      , value
      , path
      , type)
    , { params })
  }
}

export default function createValidation(options) {
  let { name, message, test, params, useCallback } = options

  function validate({ value, path, label, options, ...rest }) {
    let parent = options.parent;
    var resolve = (value) => Ref.isRef(value)
      ? value.getValue(parent, options.context)
      : value

    var createError = createErrorFactory({
        message, path, value, params
      , label, resolve, name
    })

    var ctx = { path, parent, type: name, createError, resolve, options, ...rest }

    return new Promise((resolve, reject) => {
      !useCallback
        ? resolve(test.call(ctx, value))
        : test.call(ctx, value, (err, valid) => err ? reject(err) : resolve(valid))
    })
    .then(validOrError => {
      if (ValidationError.isError(validOrError))
        throw validOrError

      else if (!validOrError)
        throw createError()
    })
  }

  validate.TEST_NAME = name
  validate.TEST_FN = test
  validate.TEST = options

  return validate
}

module.exports.createErrorFactory = createErrorFactory
