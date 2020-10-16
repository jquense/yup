import ValidationError from '../ValidationError';
import { once } from './async';

export default function runTests(options, cb) {
  let { endEarly, tests, args, value, errors, sort, path } = options;

  let callback = once(cb);
  let count = tests.length;

  if (!count) return callback(null, value);

  const nestedErrors = [];
  errors = errors ? errors : [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];

    test(args, function finishTestRun(err) {
      if (err) {
        // always return early for non validation errors
        if (!ValidationError.isError(err)) {
          return callback(err);
        }
        if (endEarly) {
          err.value = value;
          return callback(err);
        }
        nestedErrors.push(err);
      }

      if (--count <= 0) {
        if (nestedErrors.length) {
          if (sort) nestedErrors.sort(sort);

          //show parent errors after the nested ones: name.first, name
          if (errors.length) nestedErrors.push(...errors);
          errors = nestedErrors;
        }

        if (errors.length) {
          callback(new ValidationError(errors, value, path));
          return;
        }

        callback(null, value);
      }
    });
  }
}
