'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = createValidation;

var _universalPromise = require('universal-promise');

var _universalPromise2 = _interopRequireDefault(_universalPromise);

var _mapValues = require('lodash/mapValues');

var _mapValues2 = _interopRequireDefault(_mapValues);

var _ValidationError = require('../ValidationError');

var _ValidationError2 = _interopRequireDefault(_ValidationError);

var _Reference = require('../Reference');

var _Reference2 = _interopRequireDefault(_Reference);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var formatError = _ValidationError2.default.formatError;

function resolveParams(oldParams, newParams, resolve) {
  return (0, _mapValues2.default)(_extends({}, oldParams, newParams), resolve);
}

function createErrorFactory(_ref) {
  var value = _ref.value,
      label = _ref.label,
      resolve = _ref.resolve,
      opts = _objectWithoutProperties(_ref, ['value', 'label', 'resolve']);

  return function createError() {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref2$path = _ref2.path,
        path = _ref2$path === undefined ? opts.path : _ref2$path,
        _ref2$message = _ref2.message,
        message = _ref2$message === undefined ? opts.message : _ref2$message,
        _ref2$type = _ref2.type,
        type = _ref2$type === undefined ? opts.name : _ref2$type,
        params = _ref2.params;

    params = _extends({ path: path, value: value, label: label }, resolveParams(opts.params, params, resolve));

    return _extends(new _ValidationError2.default(typeof message === 'string' ? formatError(message, params) : message, value, path, type), { params: params });
  };
}

function createValidation(options) {
  var name = options.name,
      message = options.message,
      test = options.test,
      params = options.params,
      useCallback = options.useCallback;


  function validate(_ref3) {
    var value = _ref3.value,
        path = _ref3.path,
        label = _ref3.label,
        options = _ref3.options,
        rest = _objectWithoutProperties(_ref3, ['value', 'path', 'label', 'options']);

    var parent = options.parent;
    var resolve = function resolve(value) {
      return _Reference2.default.isRef(value) ? value.getValue(parent, options.context) : value;
    };

    var createError = createErrorFactory({
      message: message, path: path, value: value, params: params,
      label: label, resolve: resolve, name: name
    });

    var ctx = _extends({ path: path, parent: parent, type: name, createError: createError, resolve: resolve, options: options }, rest);

    return new _universalPromise2.default(function (resolve, reject) {
      !useCallback ? resolve(test.call(ctx, value)) : test.call(ctx, value, function (err, valid) {
        return err ? reject(err) : resolve(valid);
      });
    }).then(function (validOrError) {
      if (_ValidationError2.default.isError(validOrError)) throw validOrError;else if (!validOrError) throw createError();
    });
  }

  validate.TEST_NAME = name;
  validate.TEST_FN = test;
  validate.TEST = options;

  return validate;
}

module.exports.createErrorFactory = createErrorFactory;
module.exports = exports['default'];