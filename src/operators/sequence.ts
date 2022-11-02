import Schema, { AnySchema } from '../schema';
import { AnyObject, InferType } from '../types';
import type { TestFunction } from '../util/createValidation';
import type ValidationError from '../ValidationError';

export function sequence<
  T extends AnySchema<any, C, any, '' | 'd'>,
  C extends AnyObject,
>(builder: (schema: T) => T): TestFunction<C, T> {
  const sequenceTest: TestFunction<any, T> = async (value, ctx) => {
    let next = (ctx.schema as T).clone();
    const options = { ...ctx, value };
    type f = T['__outputType'];
    next.tests = [];
    next = builder(next);

    let tests = next.tests;
    return new Promise<boolean>((resolve, reject) => {
      let current = 0;

      function next(err: ValidationError[] | ValidationError | null) {
        if (err) reject(err);
        if (++current >= tests.length) resolve(true);
        else tests[current](options, reject, next);
      }

      if (tests.length > 0) tests[0](options, reject, next);
      else resolve(true);
    });
  };

  return sequenceTest;
}

// string.test(sequence((s) => s.email().min(1).max(2)));
