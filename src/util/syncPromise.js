function SyncPromise(fn) {
  let called = 0

  let wrapCallback = isValid => value => {
    this._isValid = isValid
    this._value = value
    called += 1
  }

  try {
    fn(wrapCallback(true), wrapCallback(false))
  } catch (e) {
    called = 1
    this._isValid = false
    this._value = e
  }

  if (called !== 1) throw new Error('Expected promise to be synchronous')
}

const wrapCreation = isValid => value => {
  if (value instanceof SyncPromise) return value
  const promise = Object.create(SyncPromise.prototype)
  promise._isValid = isValid
  promise._value = value
  return promise
};

const wrapValue = value =>
  (value instanceof SyncPromise)
    ? value
    : SyncPromise.resolve(value)

SyncPromise.resolve = wrapCreation(true)
SyncPromise.reject = wrapCreation(false)

SyncPromise.all = values => {
  const newValues = new Array(values.length)

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i]

    if (!value._isValid) return SyncPromise.reject(value)

    newValues[i] = value._value
  }

  return SyncPromise.resolve(newValues)
}

SyncPromise.prototype.then = function(resolved, rejected) {
  try {
    if (this._isValid)
      return wrapValue(resolved(this._value))

    else if (rejected)
      return wrapValue(rejected(this._value))

    return this
  } catch (e) {
    return SyncPromise.reject(e)
  }
}

SyncPromise.prototype.catch = function(rejected) {
  try {
    if (!this._isValid)
      return wrapValue(rejected(this._value))

    return this
  } catch (e) {
    return SyncPromise.reject(e)
  }
}

SyncPromise.prototype.unwrap = function() {
  return (this._isValid)
    ? { error: null, value: this._value }
    : { error: this._value, value: null }
}

module.exports = SyncPromise
