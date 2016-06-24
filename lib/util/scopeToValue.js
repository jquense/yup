'use strict';

exports.__esModule = true;
exports.default = scopeToValue;

var _universalPromise = require('universal-promise');

var _universalPromise2 = _interopRequireDefault(_universalPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Sets the error on a Validation error to a new
 * value and re throws.
 */
function scopeToValue(promises, value) {
  return _universalPromise2.default.all(promises).catch(function (err) {
    if (err.name === 'ValidationError') err.value = value;
    throw err;
  }).then(function () {
    return value;
  });
}
module.exports = exports['default'];