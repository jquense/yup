'use strict';
var { transform, has, isSchema } = require('./_')

module.exports = Conditional

class Conditional {

  constructor(refs, options) {
    let { is, then, otherwise } = options;

    this.refs = [].concat(refs)

    if (typeof options === 'function')
      this.fn = options
    else
    {
      if (!has(options, 'is'))
        throw new TypeError('`is:` is required for `when()` conditions')

      if (!options.then && !options.otherwise)
        throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions')


      let isFn = typeof is === 'function'
        ? is : ((...values) => values.every(value => value === is))

      this.fn = function (...values) {
        let ctx = values.pop();
        return isFn(...values) ? ctx.concat(then) : ctx.concat(otherwise)
      }
    }
  }

  getValue(parent, context) {
    let values = this.refs.map(r => r.getValue(parent, context))

    return values
  }

  resolve(ctx, values) {
    let schema = this.fn.apply(ctx, values.concat(ctx))

    if (schema !== undefined && !isSchema(schema))
      throw new TypeError('conditions must return a schema object')

    return schema || ctx
  }
}

module.exports = Conditional;
