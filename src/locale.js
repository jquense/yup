

module.exports = {
  mixed: {
    default:   '${path} is invalid',
    notType:   '${path} (value: `${value}`) must be a `${type}` type',
    required:  '${path} is a required field',
    oneOf:     '${path} must be one the following values: ${values}',
    notOneOf:  '${path} must not be one the following values: ${values}'
  },

  string: {
    required:  '${path} is a required field',
    min:       '${path} must be at least ${min} characters',
    max:       '${path} must be less than ${max} characters',
    matches:   '${path} must match the following: "${regex}"',
    email:     '${path} must be a valid email',
    url:       '${path} must be a valid URL',
    trim:      '${path} must be a trimmed string',
    lowercase: '${path} must be a lowercase string',
    uppercase: '${path} must be a uppercase string'
  },

  number: {
    min:       '${path} must be at least ${min}',
    max:       '${path} must be less than or equal to ${max}',
    positive:  '${path} must be a positive number',
    negative:  '${path} must be a negative number',
    integer:   '${path} must be an integer'
  },

  date: {
    min:       '${path} field must be later than ${min}',
    max:       '${path} field must be at earlier than ${max}'
  },

  boolean: {},

  object: {
    noUnknown: '${path} field cannot have keys not specified in the object shape',
  },

  array: {
    required:  '${path} is a required field',
    min:       '${path} field must have at least ${min} items',
    max:       '${path} field must have less than ${max} items'
  }
}
