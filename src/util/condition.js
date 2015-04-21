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
      if( !has(options, 'is') ) throw new TypeError('.is must be provided')
      if( !options.then && !options.otherwise ) throw new TypeError('.then or .otherwise must be provided')
      if(  options.then && options.then._type !== type || options.otherwise && options.otherwise._type !== type)
        throw new TypeError('cannot return polymorphic conditionals')

      is = typeof is === 'function'
        ? is : function(is, value) {return is === value}.bind(null, is)

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