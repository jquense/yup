'use strict';

var Promise = require('promise/lib/es6-extensions')
  , Condition   = require('./condition')
  , ValidationError = require('./validation-error')
  , getter = require('property-expr').getter
  , locale = require('../locale.js').mixed
  , _ = require('./_');

let formatError = ValidationError.formatError


function syncTest(test){
  return function (value, ctx) {
    return test.call(ctx, value)

    // if ( result && typeof result.then === 'function' )
    //   throw error()
  }
}


function createErrorFactory(orginalMessage, orginalPath, value, params) {
  return function createError({ path = orginalPath, message = orginalMessage } = {}) {
    //console.log(path, message)
    return new ValidationError(
      formatError(message, { path, value, ...params}), value, path)
  }
}

module.exports = function createValidation({ name, message, test, params, useCallback }){

  function validate({ value, path, state: { parent }, ...rest }) {
    var createError = createErrorFactory(message, path, value, params)
    var ctx = { path, parent, createError, ...rest }

    return new Promise((resolve, reject) => {
      !useCallback
        ? resolve(test.call(ctx, value))
        : test.call(ctx, value, (err, valid) => err ? reject(err) : resolve(valid))
    })
    .then(validOrError => {
      if ( ValidationError.isError(validOrError) )
        throw validOrError

      else if (!validOrError)
        throw createError()
    })
  }

  validate.test_name = name

  return validate
}

