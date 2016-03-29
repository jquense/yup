var object = require('../object')
  , array = require('../array')
  , Ref = require('./util/reference')
  , { isSchema } = require('./_')


module.exports = function toSchema(value) {
  if (isSchema(value))
    return value

  if (Ref.isRef(value))
    return value

  if (Array.isArray(value)) {
    let schema = array();
    if (value.length)
      schema = schema.of(toSchema(value[0]))
    return schema
  }
  if (typeof value === 'object') {
    return object(value);
  }

  return value
}
