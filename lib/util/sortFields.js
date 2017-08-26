'use strict';

exports.__esModule = true;
exports.default = sortFields;

var _has = require('lodash/has');

var _has2 = _interopRequireDefault(_has);

var _toposort = require('toposort');

var _toposort2 = _interopRequireDefault(_toposort);

var _propertyExpr = require('property-expr');

var _Reference = require('../Reference');

var _Reference2 = _interopRequireDefault(_Reference);

var _isSchema = require('./isSchema');

var _isSchema2 = _interopRequireDefault(_isSchema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sortFields(fields) {
  var excludes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  var edges = [],
      nodes = [];

  function addNode(depPath, key) {
    var node = (0, _propertyExpr.split)(depPath)[0];

    if (!~nodes.indexOf(node)) nodes.push(node);

    if (!~excludes.indexOf(key + '-' + node)) edges.push([key, node]);
  }

  for (var key in fields) {
    if ((0, _has2.default)(fields, key)) {
      var value = fields[key];

      if (!~nodes.indexOf(key)) nodes.push(key);

      if (_Reference2.default.isRef(value) && !value.isContext) addNode(value.path, key);else if ((0, _isSchema2.default)(value) && value._deps) value._deps.forEach(function (path) {
        return addNode(path, key);
      });
    }
  }return _toposort2.default.array(nodes, edges).reverse();
}
module.exports = exports['default'];