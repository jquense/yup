let isThenable = value => value && typeof value.then === 'function';
let isValidThenable = value => {
  if (!isThenable(value)) return false;
  if (value.__isZalgo) return true
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
  static all(values, sync) {
    if (!sync) return Promise.all(values);

    let all = new ZalgoPromise(true, (yes, no) => {
      let left = values.length;
      let result = new Array(left);
      if (left === 0) return yes(result)

      values.forEach((v, idx) => ZalgoPromise
        .resolve(v, true)
        .then(resolveValue => {
          result[idx] = resolveValue;
          if (--left <= 0) yes(result);
        }, err => {
          no(err)
        })

      )
    });
    //console.log('all', all)
    return all
  }

  static resolve(value, sync) {
    //console.log('start', value)
    if (!sync) return Promise.resolve(value);
    if (isValidThenable(value)) return value;
    // console.log('end', value)
    return new ZalgoPromise(sync, resolve => resolve(value));
  }

  static reject(value, sync) {
    if (!sync) return Promise.reject(value);
    if (isValidThenable(value)) return value;
    //console.log('reject', value)
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
    let nextValue = this.value;
    let resolved = this.status === 'fulfilled';

    try {
      if (resolved && fnResolve)
        nextValue = fnResolve(nextValue);
      if (!resolved && fnCatch){
        nextValue = fnCatch(this.value);
        resolved = true // if catch didn't throw the next promise is not an error
      }
    }
    catch (err) {
      let e = ZalgoPromise.reject(err, true);
      return e
    }

    return resolved
      ? ZalgoPromise.resolve(nextValue, true)
      : ZalgoPromise.reject(nextValue, true)
  }
}

ZalgoPromise.prototype.__isZalgo = true;
