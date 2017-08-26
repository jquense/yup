'use strict';

exports.__esModule = true;
exports.default = merge;

var _has = require('lodash/has');

var _has2 = _interopRequireDefault(_has);

var _isSchema = require('./isSchema');

var _isSchema2 = _interopRequireDefault(_isSchema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isObject = function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

function merge(target, source) {
  for (var key in source) {
    if ((0, _has2.default)(source, key)) {
      var targetVal = target[key],
          sourceVal = source[key];

      if (sourceVal === undefined) continue;

      if ((0, _isSchema2.default)(sourceVal)) {
        target[key] = (0, _isSchema2.default)(targetVal) ? targetVal.concat(sourceVal) : sourceVal;
      } else if (isObject(sourceVal)) {
        target[key] = isObject(targetVal) ? merge(targetVal, sourceVal) : sourceVal;
      } else if (Array.isArray(sourceVal)) {
        target[key] = Array.isArray(targetVal) ? targetVal.concat(sourceVal) : sourceVal;
      } else target[key] = source[key];
    }
  }return target;
}
module.exports = exports['default'];