import ValidationError from '../ValidationError';
import { TestOptions } from './createValidation';
import { Callback } from '../types';

export type RunTest = (opts: TestOptions, cb: Callback) => void;

export type TestRunOptions = {
  endEarly?: boolean;
  tests: RunTest[];
  args?: TestOptions;
  errors?: ValidationError[];
  sort?: (a: ValidationError, b: ValidationError) => number;
  path?: string;
  value: any;
  sync?: boolean;
};

const once = <T extends (...args: any[]) => any>(cb: T) => {
  let fired = false;
  return (...args: Parameters<T>) => {
    if (fired) return;
    fired = true;
    cb(...args);
  };
};

export default function runTests(options: TestRunOptions, cb: Callback): void {
  let { endEarly, tests, args, value, errors, sort, path } = options;

  let callback = once(cb);
  let count = tests.length;

  if (!count) return callback(null, value);

  const nestedErrors = [] as ValidationError[];
  errors = errors ? errors : [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];

    test(args!, function finishTestRun(err) {
      if (err) {
        // always return early for non validation errors
        if (!ValidationError.isError(err)) {
          return callback(err, value);
        }
        if (endEarly) {
          err.value = value;
          return callback(err, value);
        }
        nestedErrors.push(err);
      }

      if (--count <= 0) {
        if (nestedErrors.length) {
          if (sort) nestedErrors.sort(sort);

          //show parent errors after the nested ones: name.first, name
          if (errors!.length) nestedErrors.push(...errors!);
          errors = nestedErrors;
        }

        if (errors!.length) {
          callback(new ValidationError(errors!, value, path), value);
          return;
        }

        callback(null, value);
      }
    });
  }
}
