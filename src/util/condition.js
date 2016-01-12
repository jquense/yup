'use strict';
var { has, isSchema } = require('./_')
  , getter = require('property-expr').getter

module.exports = Conditional

class Conditional {

  constructor(key, type, options){
    let { is, then, otherwise } = options
      , prefix = options.contextPrefix || '$';

    this.prefix = prefix;
    this.key = key
    this.isContext = key.indexOf(prefix) === 0

    if ( typeof options === 'function')
      this.fn = options
    else
    {
      if( !has(options, 'is') )
        throw new TypeError('`is:` is required for `when()` conditions')

      if( !options.then && !options.otherwise )
        throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions')

      is = typeof is === 'function'
        ? is : ((is, value) => is === value).bind(null, is)

      this.fn = (value, ctx) => is(value) ? ctx.concat(then) : ctx.concat(otherwise)
    }
  }

  getValue(parent, context){
    var path = this.isContext ? this.key.slice(this.prefix.length) : this.key

    if ( (this.isContext && !context) || (!this.isContext && !context && !parent))
      throw new Error('missing the context necessary to cast this value')

    return getter(path)(this.isContext ? context : (parent || context) )
  }

  resolve(ctx, value) {
    let schema = this.fn.call(ctx, value, ctx)

    if (schema !== undefined && !isSchema(schema))
      throw new TypeError('conditions must return a schema object')

    return schema || ctx
  }
}

module.exports = Conditional;
