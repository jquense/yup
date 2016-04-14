var { isSchema } = require('./_')

class Lazy {
  constructor(mapFn) {
    this.resolve = (value) =>  {
      let schema = mapFn(value)
      if (!isSchema(schema))
        throw new TypeError('lazy() functions must return a valid schema')

      return schema
    }
  }

  cast(value, options) {
    return this.resolve(value)
      .cast(value, options)
  }

  validate(value, options) {
    return this.resolve(value)
      .validate(value, options)
  }
}


export default Lazy
