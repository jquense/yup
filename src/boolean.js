'use strict';
var MixedSchema = require('./mixed')
  , inherits = require('./util/_').inherits;

module.exports = BooleanSchema

function BooleanSchema(){
  if (!(this instanceof BooleanSchema)) 
    return new BooleanSchema()
 
  MixedSchema.call(this, { type: 'boolean'})

  this.transforms.push(function(value) {
    if ( this.isType(value) ) return value
    return (/true|1/i).test(value)
  })
}

inherits(BooleanSchema, MixedSchema, {

  _typeCheck(v){ 
    return (typeof v === 'boolean') || (typeof v === 'object' && v instanceof Boolean)
  }
})

