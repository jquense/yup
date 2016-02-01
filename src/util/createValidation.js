'use strict';
var Promise = require('promise/lib/es6-extensions')
  , Condition   = require('./condition')
  , ValidationError = require('./validation-error')
  , getter = require('property-expr').getter
  , locale = require('../locale.js').mixed
  , _ = require('./_');

let formatError = ValidationError.formatError


function createErrorFactory(orginalMessage, orginalPath, value, params, originalType) {
  return function createError({ path = orginalPath, message = orginalMessage, type = originalType } = {}) {
    return new ValidationError(
      formatError(message, { path, value, ...params}), value, path, type)
  }
}

module.exports = function createValidation(options) {
  let { name, message, test, params, useCallback } = options
  
  function validate({ value, path, state: { parent }, ...rest }) {
    var createError = createErrorFactory(message, path, value, params, name)
    var ctx = { path, parent, createError, type: name, ...rest }

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
