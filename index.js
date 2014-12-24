'use strict';
var mixed = require('./dist/mixed')
  , bool = require('./dist/boolean');

module.exports = {
  mixed:   mixed,
  string:  require('./dist/string'),
  number:  require('./dist/number'),
  boolean: bool,
  bool:    bool,
  date:    require('./dist/date'),
  object:  require('./dist/object'),
  array:   require('./dist/array'),

  reach: require('./dist/util/reach')
}
