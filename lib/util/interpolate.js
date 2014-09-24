
var expr = require('property-expr')
  , _ = require('lodash')
  , strReg = /\$\{\s*(\w+)\s*\}/g;

var strInterpolate = module.exports = _.curry(function (str, obj){
  return str.replace(strReg, function(s, key){
    return expr.getter(key)(obj);
  })
})