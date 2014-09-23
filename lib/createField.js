var Clank = require('clank')
  , _ = require('lodash')
  , fieldTypes = require('./fieldTypes')
  , fnName = require('fn-name')
  , AbstractField = require('./field');
  

module.exports = function createField(type, options){
  var isArray =  type === Array || _.isArray(type)
    , options = {};

  if ( !_.isString(type) && !_.isFunction(type) ) 
    throw new TypeError()

  if( isArray ) {
    options.subType = !!type.length ? type : null
    type = 'Array'
  }

  return new fieldTypes[typeName(type)](options)
}


function typeName(type) {
  if (type == null) return 'Mixed'
  if ( typeof type === 'function') return fnName(type)
  return type || 'Custom'
}
