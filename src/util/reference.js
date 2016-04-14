var getter = require('property-expr').getter

let validateName = d => {
  if (typeof d !== 'string')
    throw new TypeError('ref\'s must be strings, got: ' + d)
}

export default class Ref {
  static isRef(value) {
    return !!(value && (value.__isYupRef || value instanceof Ref))
  }

  constructor(key, mapFn, options = {}) {
    validateName(key)
    let prefix = options.contextPrefix || '$';

    if (typeof key === 'function') {
      key = '.';

    }

    this.key = key.trim();
    this.prefix = prefix;
    this.isContext = this.key.indexOf(prefix) === 0
    this.isSelf =  this.key === '.';

    this.path = this.isContext ? this.key.slice(this.prefix.length) : this.key
    this._get = getter(this.path, true)
    this.map = mapFn || (value => value);
  }

  cast(value, { parent, context }) {
    return this.getValue(parent, context)
  }

  getValue(parent, context) {
    let isContext = this.isContext
    let value = this._get(isContext ? context : (parent || context) || {})
    return this.map(value)
  }
}

Ref.prototype.__isYupRef = true
