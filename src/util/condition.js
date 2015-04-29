'use strict';
var { has, isSchema } = require('./_')

module.exports = Conditional

class Conditional {

  constructor(key, type, options){
    let { is, then, otherwise } = options;

    this.key = key

    if ( typeof options === 'function')
      this.fn = options
    else
    {
      if( !has(options, 'is') ) 
        throw new TypeError('`is:` is required for `when()` conditions')

      if( !options.then && !options.otherwise ) 
        throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions')

      if(  options.then && options.then._type !== type || options.otherwise && options.otherwise._type !== type)
        throw new TypeError(`cannot create polymorphic conditionals, \`then\` and \`otherwise\` must be the same type: ${type}`)

      is = typeof is === 'function'
        ? is : ((is, value) => is === value).bind(null, is)

      this.fn = (value, ctx) => is(value) ? ctx.concat(then) : ctx.concat(otherwise)
    }
  }

  resolve(ctx, value) {
    let schema = this.fn.call(ctx, value, ctx)

    if (schema !== undefined && !isSchema(schema))
      throw new TypeError('conditions must return a schema object')

    return schema || ctx
  }
}

module.exports = Conditional;