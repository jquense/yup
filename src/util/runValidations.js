import ValidationError from '../ValidationError';

let unwrapError = (errors = []) =>
  errors.inner && errors.inner.length
    ? errors.inner
    : [].concat(errors);

function scopeToValue(promises, value) {
  return Promise
    .all(promises)
    .catch(err => {
      if (err.name === 'ValidationError')
        err.value = value
      throw err
    })
    .then(() => value)
}

/**
 * If not failing on the first error, catch the errors
 * and collect them in an array
 */
export function propagateErrors(endEarly, errors) {
  return endEarly ? null : err => {
    errors.push(err)
    return err.value
  }
}

export function settled(promises){
  let settle = promise => promise.then(
    value => ({ fulfilled: true, value }),
    value => ({ fulfilled: false, value }))

  return Promise.all(promises.map(settle))
}


export function collectErrors({
  validations,
  value,
  path,
  errors = unwrapError(errors),
  sort
}){
  return settled(validations).then(results => {
    let nestedErrors = results
      .filter(r => !r.fulfilled)
      .reduce((arr, { value: error }) => {
        // we are only collecting validation errors
        if (!ValidationError.isError(error)) {
          throw error;
        }
        return arr.concat(error)
      }, [])

    if (sort) nestedErrors.sort(sort)

    //show parent errors after the nested ones: name.first, name
    errors = nestedErrors.concat(errors)

    if (errors.length)
      throw new ValidationError(errors, value, path)

    return value
  })
}


export default function runValidations({ endEarly, ...options }) {
  if (endEarly)
    return scopeToValue(options.validations, options.value)

  return collectErrors(options)
}
