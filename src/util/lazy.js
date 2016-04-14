var { isSchema } = require('./_')

class Lazy {
  constructor(mapFn) {
    this._resolve = (value) =>  {
      let schema = mapFn(value)
      if (!isSchema(schema))
        throw new TypeError('lazy() functions must return a valid schema')

      return schema
    }
  }
  resolve(context, parent, value) {
    return this._resolve(value)
  }

  cast(value, options) {
    return this._resolve(value)
      .cast(value, options)
  }

  validate(value, options) {
    return this._resolve(value)
      .validate(value, options)
  }
}


export default Lazy
