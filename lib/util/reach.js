'use strict';

exports.__esModule = true;
exports.default = reach;

var _propertyExpr = require('property-expr');

var _has = require('lodash/has');

var _has2 = _interopRequireDefault(_has);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var trim = function trim(part) {
  return part.substr(0, part.length - 1).substr(1);
};

function reach(obj, path, value, context) {
  var parent = void 0,
      lastPart = void 0;

  // if only one "value" arg then use it for both
  context = context || value;

  (0, _propertyExpr.forEach)(path, function (_part, isBracket, isArray) {
    var part = isBracket ? trim(_part) : _part;

    if (isArray || (0, _has2.default)(obj, '_subType')) {
      // we skipped an array: foo[].bar
      var idx = isArray ? parseInt(part, 10) : 0;

      obj = obj.resolve({ context: context, parent: parent, value: value })._subType;

      if (value) {
        if (isArray && idx >= value.length) {
          throw new Error('Yup.reach cannot resolve an array item at index: ' + _part + ', in the path: ' + path + '. ' + 'because there is no value at that index. ');
        }

        value = value[idx];
      }
    }

    if (!isArray) {
      obj = obj.resolve({ context: context, parent: parent, value: value });

      if (!(0, _has2.default)(obj, 'fields') || !(0, _has2.default)(obj.fields, part)) throw new Error('The schema does not contain the path: ' + path + '. ' + ('(failed at: ' + lastPart + ' which is a type: "' + obj._type + '") '));

      obj = obj.fields[part];

      parent = value;
      value = value && value[part];
      lastPart = isBracket ? '[' + _part + ']' : '.' + _part;
    }
  });

  if (obj) {
    obj = obj.resolve({ context: context, parent: parent, value: value });
  }

  return obj;
}
module.exports = exports['default'];