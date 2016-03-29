'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _require = require('./_');

var _has = _require.has;

module.exports = (function () {
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

  BadSet.prototype['delete'] = function _delete(item) {
    delete this._map[stringify(item)];
  };

  BadSet.prototype.has = function has(item) {
    return _has(this._map, stringify(item));
  };

  _createClass(BadSet, [{
    key: 'length',
    get: function get() {
      return Object.keys(this._map).length;
    }
  }]);

  return BadSet;
})();

function stringify(item) {
  return JSON.stringify(item);
}