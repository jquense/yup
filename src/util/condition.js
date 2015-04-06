'use strict';
var has = require('./has')

module.exports = Conditional

class Conditional {

  constructor(key, current, options){
    var type = current._type;

    this.key = key

    if ( typeof options === 'function')
      this.fn = options
    else
    {
      if( !has(options, 'is') ) throw new TypeError('.is must be provided')
      if( !options.then && !options.otherwise ) throw new TypeError('.then or .otherwise must be provided')
      if(  options.then && options.then._type !== type || options.otherwise && options.otherwise._type !== type)
        throw new TypeError('cannot return polymorphic conditionals')

      this.is        = options.is
      this.then      = options.then
      this.otherwise = options.otherwise
    }
  }

  resolve(ctx, value) {
    var schema, matches, then, otherwise;

    if( this.fn ) {
      schema = this.fn.call(ctx, value)
      if (schema !== undefined && !schema.__isYupSchema__)
        throw new TypeError('conditions must return a schema object')

      return schema || ctx
    }

    matches = this.is.__isYupSchema__
      ? this.is.isValid(value)
      : this.is === value

    then      = this.then      ? ctx.concat(this.then)      : ctx
    otherwise = this.otherwise ? ctx.concat(this.otherwise) : ctx

    return matches ? then : otherwise
  }
}

module.exports = Conditional;