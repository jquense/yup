import type ValidationError from '../ValidationError';
import type {
  NextCallback,
  PanicCallback,
  TestOptions,
} from './createValidation';

export type RunTest = (
  opts: TestOptions,
  panic: PanicCallback,
  next: NextCallback,
) => void;

export type TestRunOptions = {
  tests: RunTest[];
  args?: TestOptions;
  value: any;
};

/**
 * Executes a set of validations, either schema, produced Tests or a nested
 * schema validate result. `args` is intended for schema validation tests, but
 * isn't required to allow the helper to awkwardly be used to run nested array/object
 * validations.
 */
export default function runTests(
  options: TestRunOptions,
  panic: (err: Error, value: unknown) => void,
  next: (errors: ValidationError[], value: unknown) => void,
): void {
  let fired = false;
  let { tests, args, value } = options;

  let panicOnce = (arg: Error) => {
    if (fired) return;
    fired = true;
    panic(arg, value);
  };

  let nextOnce = (arg: ValidationError[]) => {
    if (fired) return;
    fired = true;
    next(arg, value);
  };

  let count = tests.length;
  let nestedErrors = [] as ValidationError[];

  if (!count) return nextOnce([]);

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];

    test(args!, panicOnce, function finishTestRun(err) {
      if (err) {
        nestedErrors = nestedErrors.concat(err);
      }
      if (--count <= 0) {
        nextOnce(nestedErrors);
      }
    });
  }
}
