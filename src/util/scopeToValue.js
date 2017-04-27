
/**
 * Sets the error on a Validation error to a new
 * value and re throws.
 */
export default function scopeToValue(promises, value) {
  return Promise
    .all(promises)
    .catch(err => {
      if (err.name === 'ValidationError')
        err.value = value
      throw err
    })
    .then(() => value)
}
