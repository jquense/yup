'use strict';

module.exports = function expr(obj, path){
  var parts = (path || '').split('.')
    , part, idx;

  while(parts.length) {
    part = parts.shift()

    if( (idx = part.indexOf('[')) !== -1 )
      part = part.substr(0, idx)

    if (obj.fields) {
      obj = obj.fields[part] || {}
      if(idx !== -1) obj = obj._subType ||{}
    }
    else if (obj._subType)
      obj = obj._subType || {}
  }

  return obj
}
