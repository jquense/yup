import getPromise from './getPromise';
import ValidationError from '../ValidationError';

const unwrapError = (errors = []) =>
  (errors.inner && errors.inner.length
    ? errors.inner
    : [].concat(errors));

function scopeToValue({ validations, value, sync }) {
  return getPromise(sync)
    .all(validations)
    .catch((err) => {
      if (err.name === 'ValidationError') {
        err.value = value; // eslint-disable-line no-param-reassign
      }
      throw err;
    })
    .then(() => value);
}

/**
 * If not failing on the first error, catch the errors
 * and collect them in an array
 */
export function propagateErrors(abortEarly, errors) {
  return abortEarly ? null : (err) => {
    errors.push(err);
    return err.value;
  };
}

export function settled(promises, sync) {
  const settle = promise => promise.then(
    value => ({ fulfilled: true, value }),
    value => ({ fulfilled: false, value }));

  return getPromise(sync).all(promises.map(settle));
}


export function collectErrors({
  validations,
  value,
  path,
  errors,
  sort,
  sync,
}) {
  return settled(validations, sync).then((results) => {
    const nestedErrors = results
      .filter(r => !r.fulfilled)
      .reduce((arr, { value: error }) => {
        // we are only collecting validation errors
        if (!ValidationError.isError(error)) {
          throw error;
        }
        return arr.concat(error);
      }, []);

    if (sort) {
      nestedErrors.sort(sort);
    }

    // show parent errors after the nested ones: name.first, name
    const allErrors = nestedErrors.concat(unwrapError(errors));

    if (allErrors.length) {
      throw new ValidationError(allErrors, value, path);
    }

    return value;
  });
}


export default function runValidations({ abortEarly, ...options }) {
  if (abortEarly) {
    return scopeToValue(options);
  }

  return collectErrors(options);
}
