'use strict';

var babelHelpers = require('./babelHelpers.js');

var Promise = require('promise/lib/es6-extensions'),
    Condition = require('./condition'),
    ValidationError = require('./validation-error'),
    getter = require('property-expr').getter,
    locale = require('../locale.js').mixed,
    _ = require('./_');

var formatError = ValidationError.formatError;

function syncTest(test) {
  return function (value, ctx) {
    return test.call(ctx, value)

    // if ( result && typeof result.then === 'function' )
    //   throw error()
    ;
  };
}

function createErrorFactory(orginalMessage, orginalPath, value, params) {
  return function createError() {
    var _ref = arguments[0] === undefined ? {} : arguments[0];

    var _ref$path = _ref.path;
    var path = _ref$path === undefined ? orginalPath : _ref$path;
    var _ref$message = _ref.message;
    var message = _ref$message === undefined ? orginalMessage : _ref$message;

    //console.log(path, message)
    return new ValidationError(formatError(message, babelHelpers._extends({ path: path, value: value }, params)), value, path);
  };
}

module.exports = function createValidation(_ref2) {
  var name = _ref2.name;
  var message = _ref2.message;
  var test = _ref2.test;
  var params = _ref2.params;
  var useCallback = _ref2.useCallback;

  function validate(_ref3) {
    var value = _ref3.value;
    var path = _ref3.path;
    var parent = _ref3.state.parent;
    var rest = babelHelpers.objectWithoutProperties(_ref3, ['value', 'path', 'state']);

    var createError = createErrorFactory(message, path, value, params);
    var ctx = babelHelpers._extends({ path: path, parent: parent, createError: createError }, rest);

    return new Promise(function (resolve, reject) {
      !useCallback ? resolve(test.call(ctx, value)) : test.call(ctx, value, function (err, valid) {
        return err ? reject(err) : resolve(valid);
      });
    }).then(function (validOrError) {
      if (ValidationError.isError(validOrError)) throw validOrError;else if (!validOrError) throw createError();
    });
  }

  validate.test_name = name;

  return validate;
};