'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isThenable = function isThenable(value) {
  return value && typeof value.then === 'function';
};
var assertThenable = function assertThenable(value) {
  if (!isThenable(value)) return value;
  if (value.__isZalgo) return value;
  throw new Error('Cannot convert an real promise to a synchronous one');
};

function resolve(inst, value) {
  if (inst.status) return;
  inst.value = value;
  inst.status = 'fulfilled';
}

function reject(inst, value) {
  if (inst.status) return;
  inst.value = value;
  inst.status = 'rejected';
}

var ZalgoPromise = function () {
  ZalgoPromise.all = function all(values, sync) {
    if (!sync) return Promise.all(values);

    return new ZalgoPromise(function (yes, no) {
      var left = values.length;
      var result = new Array(left);

      values.forEach(function (v, idx) {
        return ZalgoPromise.resolve(v, true).then(function (resolveValue) {
          result[idx] = resolveValue;
          if (--left <= 0) yes(result);
        }, no);
      });
    });
  };

  ZalgoPromise.resolve = function resolve(value, sync) {
    if (!sync) return Promise.resolve(value);
    if (assertThenable(value)) return value;
    return new ZalgoPromise(sync, function (resolve) {
      return resolve(value);
    });
  };

  ZalgoPromise.reject = function reject(value, sync) {
    if (!sync) return Promise.reject(value);
    if (assertThenable(value)) return value;
    return new ZalgoPromise(sync, function (_, reject) {
      return reject(value);
    });
  };

  function ZalgoPromise(sync, fn) {
    _classCallCheck(this, ZalgoPromise);

    if (!sync) return new Promise(fn);

    try {
      fn(resolve.bind(null, this), reject.bind(null, this));
    } catch (err) {
      reject(this, err);
    }

    if (!this.status) throw new Error('Sync Promises must resolve synchronously');
  }

  ZalgoPromise.prototype.catch = function _catch(fn) {
    return this.then(null, fn);
  };

  ZalgoPromise.prototype.then = function then(fnResolve, fnCatch) {
    var nextValue;
    try {
      if (this.status === 'fulfilled') nextValue = fnResolve ? fnResolve(this.value) : this.value;else nextValue = fnCatch ? fnCatch(this.value) : this.value;
    } catch (err) {
      return ZalgoPromise.reject(err, true);
    }
    return ZalgoPromise.resolve(nextValue, true);
  };

  return ZalgoPromise;
}();

ZalgoPromise.__isZalgo = true;
exports.default = ZalgoPromise;