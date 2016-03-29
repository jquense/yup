'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var Promise = require('promise/lib/es6-extensions');
var ValidationError = require('./validation-error');
var Ref = require('./reference');

var _require = require('./_');

var transform = _require.transform;

var formatError = ValidationError.formatError;

function resolveParams(oldParams, newParams, resolve) {
  var start = _extends({}, oldParams, newParams);
  return transform(start, function (obj, value, key) {
    obj[key] = resolve(value);
  });
}

function createErrorFactory(_ref) {
  var value = _ref.value;
  var label = _ref.label;
  var resolve = _ref.resolve;

  var opts = _objectWithoutProperties(_ref, ['value', 'label', 'resolve']);

  return function createError() {
    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref2$path = _ref2.path;
    var path = _ref2$path === undefined ? opts.path : _ref2$path;
    var _ref2$message = _ref2.message;
    var message = _ref2$message === undefined ? opts.message : _ref2$message;
    var _ref2$type = _ref2.type;
    var type = _ref2$type === undefined ? opts.name : _ref2$type;
    var params = _ref2.params;

    params = resolveParams(opts.params, params, resolve);

    return new ValidationError(formatError(message, _extends({ path: path, value: value, label: label }, params)), value, path, type);
  };
}

module.exports = function createValidation(options) {
  var name = options.name;
  var message = options.message;
  var test = options.test;
  var params = options.params;
  var useCallback = options.useCallback;

  function validate(_ref3) {
    var value = _ref3.value;
    var path = _ref3.path;
    var label = _ref3.label;
    var parent = _ref3.state.parent;

    var rest = _objectWithoutProperties(_ref3, ['value', 'path', 'label', 'state']);

    var resolve = function resolve(value) {
      return Ref.isRef(value) ? value.getValue(parent, rest.options.context) : value;
    };

    var createError = createErrorFactory({
      message: message, path: path, value: value, params: params,
      label: label, resolve: resolve, name: name
    });

    var ctx = _extends({ path: path, parent: parent, type: name, createError: createError, resolve: resolve }, rest);

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