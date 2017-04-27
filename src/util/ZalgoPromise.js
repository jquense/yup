import Promise from 'universal-promise'

let isThenable = value => value && typeof value.then === 'function';
let assertThenable = value => {
  if (!isThenable(value)) return value;
  if (value.__isZalgo) return value
  throw new Error('Cannot convert an real promise to a synchronous one')
};

function resolve(inst, value) {
  if (inst.status) return
  inst.value = value;
  inst.status = 'fulfilled';
}

function reject(inst, value) {
  if (inst.status) return
  inst.value = value;
  inst.status = 'rejected';
}

export default class ZalgoPromise {
  static __isZalgo = true;

  static all(values, sync) {
    if (!sync) return Promise.all(values);

    return new ZalgoPromise((yes, no) => {
      let left = values.length;
      let result = new Array(left);

      values.forEach((v, idx) => ZalgoPromise
        .resolve(v, true)
        .then(resolveValue => {
          result[idx] = resolveValue;
          if (--left <= 0) yes(result);
        }, no)
      )
    });
  }

  static resolve(value, sync) {
    if (!sync) return Promise.resolve(value);
    if (assertThenable(value)) return value;
    return new ZalgoPromise(sync, resolve => resolve(value));
  }
  static reject(value, sync) {
    if (!sync) return Promise.reject(value);
    if (assertThenable(value)) return value;
    return new ZalgoPromise(sync, (_, reject) => reject(value));
  }

  constructor(sync, fn) {
    if (!sync) return new Promise(fn);

    try {
      fn(resolve.bind(null, this), reject.bind(null, this));
    } catch (err) {
      reject(this, err);
    }

    if (!this.status)
      throw new Error('Sync Promises must resolve synchronously');
  }

  catch(fn) {
    return this.then(null, fn);
  }

  then(fnResolve, fnCatch) {
    var nextValue;
    try {
      if (this.status === 'fulfilled')
        nextValue = fnResolve ? fnResolve(this.value) : this.value;
      else
        nextValue = fnCatch ? fnCatch(this.value) : this.value;
    }
    catch (err) {
      return ZalgoPromise.reject(err, true);
    }
    return ZalgoPromise.resolve(nextValue, true);
  }
}
