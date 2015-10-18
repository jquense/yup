'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var toString = Object.prototype.toString;
var isDate = function isDate(obj) {
  return toString.call(obj) === '[object Date]';
};

module.exports = (function () {
  function BadSet() {
    _classCallCheck(this, BadSet);

    this._array = [];
    this.length = 0;
  }

  BadSet.prototype.values = function values() {
    return this._array;
  };

  BadSet.prototype.add = function add(item) {
    if (!this.has(item)) this._array.push(item);

    this.length = this._array.length;
  };

  BadSet.prototype['delete'] = function _delete(item) {
    var idx = indexOf(this._array, item);
    if (idx !== -1) this._array.splice(idx, 1);

    this.length = this._array.length;
  };

  BadSet.prototype.has = function has(val) {
    return indexOf(this._array, val) !== -1;
  };

  return BadSet;
})();

function indexOf(arr, val) {
  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
    if (item === val || isDate(item) && +val === +item) return i;
  }
  return -1;
}