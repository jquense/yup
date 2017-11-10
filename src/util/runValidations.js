import { SynchronousPromise } from './syncPromise';
import ValidationError from '../ValidationError';

let promise = sync => sync ? SynchronousPromise: Promise;

let unwrapError = (errors = []) =>
  errors.inner && errors.inner.length
    ? errors.inner
    : [].concat(errors);

function scopeToValue(promises, value, sync) {
  //console.log('scopeToValue', promises, value)
  let p = promise(sync).all(promises);

  //console.log('scopeToValue B', p)

  let b = p.catch(err => {
      if (err.name === 'ValidationError')
        err.value = value
      throw err
    })
  //console.log('scopeToValue c', b)
  let c = b.then(() => value);
  //console.log('scopeToValue d', c)
  return c
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

export function settled(promises, sync) {
  let settle = promise => promise.then(
    value => ({ fulfilled: true, value }),
    value => ({ fulfilled: false, value }))

  return promise(sync).all(promises.map(settle))
}


export function collectErrors({
  validations,
  value,
  path,
  sync,
  errors,
  sort
}){
  errors = unwrapError(errors);
  return settled(validations, sync).then(results => {
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
    return scopeToValue(options.validations, options.value, options.sync)

  return collectErrors(options)
}
