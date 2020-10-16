export function asCallback(promise, callback) {
  promise.then((result) => callback(null, result), callback);
}

export const once = (cb) => {
  let fired = false;
  return (...args) => {
    if (fired) return;
    fired = true;
    cb(...args);
  };
};

export function parallel(fns, cb) {
  let callback = once(cb);
  let count = fns.length;
  if (count === 0) {
    return void callback(null, []);
  }
  let results = new Array(count);

  for (let i = 0; i < fns.length; i++) {
    let idx = i;
    const fn = fns[i];
    fn((err, value) => {
      if (err) return callback(err);

      results[idx] = value;
      if (--count <= 0) callback(null, results);
    });
  }
}

export function settled(fns, cb) {
  let callback = once(cb);
  let count = fns.length;
  if (count === 0) {
    return void callback(null, []);
  }
  const results = new Array(fns.length);
  for (let i = 0; i < fns.length; i++) {
    let idx = i;
    const fn = fns[i];
    fn((err, value) => {
      results[idx] = err
        ? { fulfilled: false, value: err }
        : { fulfilled: true, value };

      if (--count <= 0) callback(null, results);
    });
  }
}
