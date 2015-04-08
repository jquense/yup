'use strict';
var mixed = require('./mixed')
  , bool = require('./boolean');

module.exports = {
  mixed:   mixed,
  string:  require('./string'),
  number:  require('./number'),
  boolean: bool,
  bool:    bool,
  date:    require('./date'),
  object:  require('./object'),
  array:   require('./array'),

  reach: require('./util/reach'),
  
  ValidationError: require('./util/validation-error')
}
