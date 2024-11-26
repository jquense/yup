import {
  string,
  number,
  array,
  bool,
  object,
  date,
  mixed,
  tuple,
} from '../src';
import type { v1 } from '@standard-schema/spec';

function verifyStandardSchema<Input, Output>(
  schema: v1.StandardSchema<Input, Output>,
) {
  return (
    schema['~standard'].version === 1 &&
    schema['~standard'].vendor === 'yup' &&
    typeof schema['~standard'].validate === 'function'
  );
}

test('is compatible with standard schema', () => {
  expect(verifyStandardSchema(string())).toBe(true);
  expect(verifyStandardSchema(number())).toBe(true);
  expect(verifyStandardSchema(array())).toBe(true);
  expect(verifyStandardSchema(bool())).toBe(true);
  expect(verifyStandardSchema(object())).toBe(true);
  expect(verifyStandardSchema(date())).toBe(true);
  expect(verifyStandardSchema(mixed())).toBe(true);
  expect(verifyStandardSchema(tuple([mixed()]))).toBe(true);
});
