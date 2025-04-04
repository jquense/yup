import {
  string,
  number,
  array,
  bool,
  object,
  date,
  mixed,
  tuple,
  lazy,
} from '../src';
import type { StandardSchemaV1 } from '@standard-schema/spec';

function verifyStandardSchema<Input, Output>(
  schema: StandardSchemaV1<Input, Output>,
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
  expect(verifyStandardSchema(lazy(() => string()))).toBe(true);
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

test('should clone correctly when using modifiers', async () => {
  const schema = string().required();

  const result = await schema['~standard'].validate('');

  expect(result.issues).toEqual([
    { path: undefined, message: 'this is a required field' },
  ]);
});

test('should work correctly with lazy schemas', async () => {
  let isNumber = false;
  const schema = lazy(() => {
    if (isNumber) {
      return number().min(10);
    }

    return string().required().min(12);
  });

  const result = await schema['~standard'].validate('');

  expect(result.issues).toEqual([
    { path: undefined, message: 'this is a required field' },
    { path: undefined, message: 'this must be at least 12 characters' },
  ]);

  isNumber = true;

  const result2 = await schema['~standard'].validate(5);

  expect(result2.issues).toEqual([
    { path: undefined, message: 'this must be greater than or equal to 10' },
  ]);
});
