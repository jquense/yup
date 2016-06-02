'use strict';
var Promise = require('universal-promise')
  , ValidationError = require('./validation-error')
  , Ref = require('./reference')
  , { transform } = require('./_')
  , SyncPromise = require('./syncPromise');

let formatError = ValidationError.formatError

function resolveParams(oldParams, newParams, resolve) {
  let start = { ...oldParams, ...newParams }
  return transform(start, (obj, value, key) => {
    obj[key] = resolve(value)
  })
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

module.exports = function createValidation(options) {
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

    let promise

    if (useCallback)
      promise = new Promise((resolve, reject) => {
        test.call(ctx, value, (err, valid) => err ? reject(err) : resolve(valid))
      })

    else if (options.sync)
      promise = SyncPromise.resolve(resolve(test.call(ctx, value)))

    else
      promise = Promise.resolve(resolve(test.call(ctx, value)))

    return promise
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
