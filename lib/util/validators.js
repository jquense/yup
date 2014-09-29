var _ = require('lodash')
  , interpolate = require('./interpolate')


function Validation(message, validate, options) {
  if(!(this instanceof Validation)) 
    return new Validation(message, validate, options)
  
  var msgFn = interpolate(message || '${name} Field invalid')

  this.isValid = function(value, field) {
    options.name = field.path || 'this'
    this.error = msgFn(options)
    return validate(value, options, field)
  } 
}

function createValidator(defaultMsg, keys, fn){
  return function validate(){
    var l = arguments.length
      , options = {}
      , message = defaultMsg;

    for(var i = 0; i < l; i++){
      if(i === keys.length) message = arguments[i] 
      else  options[keys[i]] = arguments[i]
    }
      
    return new Validation(message, fn, options)
  }
}

var validators = module.exports = {

  validator: Validation,

  required: createValidator('${name} field required', []
    , function(val, params, field){

        return field.required 
          ? field.required(val)
          : !(!val && val !== _.result(field, 'default'))
      }),

  matches: createValidator(
      '${name} field must match "${regex}"', ['regex']
    , function (val, params, field){
        return params.regex.test(field.cast(val))
      }),

  max: createValidator(
      '${name} field must be at least ${max}', ['max']
    , function (val, params, field){

        return field.max 
          ? field.max(val, params.max) 
          : +val <= +params.max
      }),

  min: createValidator(
      '${name} field must be at least ${min}', ['min']
    , function (val, params, field) {

        return field.min 
          ? field.min(val, params.min) 
          : +val >= +params.min
      }),

  range: createValidator(
      '${name} field must be between ${min} and ${max}', ['min', 'max']
    , function (val, params, field) {

        return field.range 
          ? field.range(val, params.min, params.max)
          : (validators.min(params.min).isValid(val, field) 
            && validators.max(params.max).isValid(val, field))
      }),
}
