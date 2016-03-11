'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var Promise = require('promise/lib/es6-extensions'),
    ValidationError = require('./validation-error');

var formatError = ValidationError.formatError;

function createErrorFactory(orginalMessage, orginalPath, value, orginalParams, originalType) {
  return function createError() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$path = _ref.path;
    var path = _ref$path === undefined ? orginalPath : _ref$path;
    var _ref$message = _ref.message;
    var message = _ref$message === undefined ? orginalMessage : _ref$message;
    var _ref$type = _ref.type;
    var type = _ref$type === undefined ? originalType : _ref$type;
    var params = _ref.params;

    return new ValidationError(formatError(message, _extends({ path: path, value: value }, orginalParams, params)), value, path, type);
  };
}

module.exports = function createValidation(options) {
  var name = options.name;
  var message = options.message;
  var test = options.test;
  var params = options.params;
  var useCallback = options.useCallback;

  function validate(_ref2) {
    var value = _ref2.value;
    var path = _ref2.path;
    var label = _ref2.label;
    var parent = _ref2.state.parent;

    var rest = _objectWithoutProperties(_ref2, ['value', 'path', 'label', 'state']);

    var createError = createErrorFactory(message, label || path, value, params, name);
    var ctx = _extends({ path: path, parent: parent, createError: createError, type: name }, rest);

    return new Promise(function (resolve, reject) {
      !useCallback ? resolve(test.call(ctx, value)) : test.call(ctx, value, function (err, valid) {
        return err ? reject(err) : resolve(valid);
      });
    }).then(function (validOrError) {
      if (ValidationError.isError(validOrError)) throw validOrError;else if (!validOrError) throw createError();
    });
  }

  validate.TEST_NAME = name;
  validate.TEST_FN = test;
  validate.TEST = options;

  return validate;
};

module.exports.createErrorFactory = createErrorFactory;