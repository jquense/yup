'use strict';
var expr = require('property-expr')
var strReg = /\$\{\s*(\w+)\s*\}/g;

module.exports = function strInterpolate(str, obj){
  if ( arguments.length === 1)
    return (obj) => 
      str.replace(strReg, (_, key) => expr.getter(key)(obj) || '')
    
  return str.replace(strReg, (_, key) => expr.getter(key)(obj) || '')
}