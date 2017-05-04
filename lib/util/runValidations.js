'use strict';

exports.__esModule = true;
exports.propagateErrors = propagateErrors;
exports.settled = settled;
exports.collectErrors = collectErrors;
exports.default = runValidations;

var _ValidationError = require('../ValidationError');

var _ValidationError2 = _interopRequireDefault(_ValidationError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var unwrapError = function unwrapError() {
  var errors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  return errors.inner && errors.inner.length ? errors.inner : [].concat(errors);
};

function scopeToValue(promises, value) {
  return Promise.all(promises).catch(function (err) {
    if (err.name === 'ValidationError') err.value = value;
    throw err;
  }).then(function () {
    return value;
  });
}

/**
 * If not failing on the first error, catch the errors
 * and collect them in an array
 */
function propagateErrors(endEarly, errors) {
  return endEarly ? null : function (err) {
    errors.push(err);
    return err.value;
  };
}

function settled(promises) {
  var settle = function settle(promise) {
    return promise.then(function (value) {
      return { fulfilled: true, value: value };
    }, function (value) {
      return { fulfilled: false, value: value };
    });
  };

  return Promise.all(promises.map(settle));
}

function collectErrors(_ref) {
  var validations = _ref.validations,
      value = _ref.value,
      path = _ref.path,
      _ref$errors = _ref.errors,
      errors = _ref$errors === undefined ? unwrapError(errors) : _ref$errors,
      sort = _ref.sort;

  return settled(validations).then(function (results) {
    var nestedErrors = results.filter(function (r) {
      return !r.fulfilled;
    }).reduce(function (arr, _ref2) {
      var error = _ref2.value;

      // we are only collecting validation errors
      if (!_ValidationError2.default.isError(error)) {
        throw error;
      }
      return arr.concat(error);
    }, []);

    if (sort) nestedErrors.sort(sort);

    //show parent errors after the nested ones: name.first, name
    errors = nestedErrors.concat(errors);

    if (errors.length) throw new _ValidationError2.default(errors, value, path);

    return value;
  });
}

function runValidations(_ref3) {
  var endEarly = _ref3.endEarly,
      options = _objectWithoutProperties(_ref3, ['endEarly']);

  if (endEarly) return scopeToValue(options.validations, options.value);

  return collectErrors(options);
}