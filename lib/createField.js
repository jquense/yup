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
    options.subField = fieldTypes[typeName(type[0])].create(options)
    type = 'Array'
  }

  return fieldTypes[typeName(type)].create(options)
}


function typeName(type) {
  if (type == null) return 'Mixed'
  if ( typeof type === 'function') return fnName(type)
  return type || 'Custom'
}
