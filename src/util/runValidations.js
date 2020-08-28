import ValidationError from '../ValidationError';
import { settled, parallel } from './async';

let unwrapError = (errors = []) =>
  errors.inner && errors.inner.length ? errors.inner : [].concat(errors);

/**
 * If not failing on the first error, catch the errors
 * and collect them in an array
 */
export function propagateErrors(endEarly, errors) {
  return endEarly
    ? null
    : (err) => {
        errors.push(err);
        return err.value;
      };
}

export function collectErrors({ validations, value, path, errors, sort }, cb) {
  errors = unwrapError(errors);

  return settled(validations, (err, results) => {
    if (err) return cb(err);

    let nestedErrors = results
      .filter((r) => !r.fulfilled)
      .reduce((arr, { value: error }) => {
        // we are only collecting validation errors
        if (!ValidationError.isError(error)) {
          return cb(error);
        }
        return arr.concat(error);
      }, []);

    if (sort) nestedErrors.sort(sort);

    //show parent errors after the nested ones: name.first, name
    errors = nestedErrors.concat(errors);

    if (errors.length) cb(new ValidationError(errors, value, path));
    else cb(null, value);
  });
}

export default function runValidations({ endEarly, ...options }, cb) {
  if (!endEarly) {
    collectErrors(options, cb);
    return;
  }

  parallel(options.validations, (err) => {
    if (err && err.name === 'ValidationError') err.value = options.value;
    cb(err, options.value);
  });
}
