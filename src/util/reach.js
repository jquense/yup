'use strict';
let { forEach } = require('property-expr');

let trim = part => part.substr(0, part.length - 1).substr(1)

module.exports = function (obj, path) {
  forEach(path, (part, isBracket, isArray) => {
    if( isArray) 
      obj = obj._subType  
    else {
      if (obj._subType) // we skipped an array
        obj = obj._subType
  
      obj = obj.fields[isBracket ? trim(part) : part] 
    } 
  })

  return obj
}
