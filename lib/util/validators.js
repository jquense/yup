var _ = require('lodash')
  , interpolate = require('./interpolate')



function Validation(msg, fn) {
  if(!(this instanceof Validation)) 
    return new Validation(msg,fn)
  this.validate = fn
  this.message = msg
}

function createValidator(defaultMsg, keys, fn){
  return function validat(){
    var l = arguments.length
      , options = {}
      , message = defaultMsg;

    for(var i = 0; i < l; i++){
      if(i === keys.length) message = arguments[i] 
      else  options[keys[i]] = arguments[i]
    }
      
    return new Validation(
        interpolate(message || 'Field invalid', options)
      , _.partial(fn, options))
  }
}

var validators = module.exports = {

  validator: Validation,

  required: createValidator('field required', []
    , function(params, val, field){

        return field.required 
          ? field.required(val)
          : !(!val && val !== _.result(field, 'default'))
      }),

  matches: createValidator(
      'field must match "${regex}"', ['regex']
    , function (params, val, field){
        return params.regex.test(field.cast(val))
      }),

  max: createValidator(
      'field must be at least ${max}', ['max']
    , function (params, val, field){

        return field.max 
          ? field.max(val, params.max) 
          : +val <= +params.max
      }),

  min: createValidator(
      'field must be at least ${min}', ['min']
    , function (params, val, field) {

        return field.min 
          ? field.min(val, params.min) 
          : +val >= +params.min
      }),

  range: createValidator(
      'field must be between ${min} and ${max}', ['min', 'max']
    , function (params, val, field) {

        return field.range 
          ? field.range(val, params.min, params.max)
          : (validators.min(params.min).validate(val, field) 
            && validators.max(params.max).validate(val, field))
      }),
}
