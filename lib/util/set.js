'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BadSet = function () {
  function BadSet() {
    _classCallCheck(this, BadSet);

    this._map = Object.create(null);
    this._refs = Object.create(null);
  }

  BadSet.prototype.values = function values() {
    var _this = this;

    return Object.keys(this._map).map(function (v) {
      return _this._map[v];
    });
  };

  BadSet.prototype.add = function add(item) {
    this._map[stringify(item)] = item;
  };

  BadSet.prototype.delete = function _delete(item) {
    delete this._map[stringify(item)];
  };

  BadSet.prototype.has = function has(item) {
    return (0, _has3.default)(this._map, stringify(item));
  };

  _createClass(BadSet, [{
    key: 'length',
    get: function get() {
      return Object.keys(this._map).length;
    }
  }]);

  return BadSet;
}();

exports.default = BadSet;


function stringify(item) {
  return JSON.stringify(item);
}