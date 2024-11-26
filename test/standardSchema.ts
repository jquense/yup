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

test('issues path is an array of property paths', async () => {
  const schema = object({
    obj: object({
      foo: string().required(),
      'not.obj.nested': string().required(),
    }).required(),
    arr: array(
      object({
        foo: string().required(),
        'not.array.nested': string().required(),
      }),
    ).required(),
    'not.a.field': string().required(),
  });

  const result = await schema['~standard'].validate({
    obj: { foo: '', 'not.obj.nested': '' },
    arr: [{ foo: '', 'not.array.nested': '' }],
  });

  expect(result.issues).toEqual([
    { path: ['obj', 'foo'], message: 'obj.foo is a required field' },
    {
      path: ['obj', 'not.obj.nested'],
      message: 'obj["not.obj.nested"] is a required field',
    },
    { path: ['arr', '0', 'foo'], message: 'arr[0].foo is a required field' },
    {
      path: ['arr', '0', 'not.array.nested'],
      message: 'arr[0]["not.array.nested"] is a required field',
    },
    { path: ['not.a.field'], message: '["not.a.field"] is a required field' },
  ]);
});
