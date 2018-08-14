const { object, string, number, date } = require('yup')

const contactSchema = object({
  name: string()
    .required(),
  age: number()
    .required()
    .positive()
    .integer(),
  email: string()
    .email(),
  website: string()
    .url(),
  createdOn: date()
    .default(() => new Date())
})

contactSchema.cast({
  name: 'jimmy',
  age: '24',
  createdOn: '2014-09-23T19:25:25Z'
})
