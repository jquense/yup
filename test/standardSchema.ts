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

describe('Array schema standard interface tests', () => {
  test('should handle basic array validation', async () => {
    const schema = array(string());

    // Test with valid array
    const validResult = await schema['~standard'].validate(['a', 'b', 'c']);
    if (!validResult.issues) {
      expect(validResult.value).toEqual(['a', 'b', 'c']);
    }

    // Test with invalid array items - use an object that can't be cast to string
    const invalidResult = await schema['~standard'].validate([
      'a',
      { foo: 'bar' },
      'c',
    ]);
    expect(invalidResult.issues).toBeDefined();
    expect(invalidResult.issues?.[0]?.path).toEqual(['1']);
    expect(invalidResult.issues?.[0]?.message).toContain(
      'must be a `string` type',
    );
  });

  test('should handle array length validations', async () => {
    const schema = array(string()).min(2).max(4);

    // Test empty array
    const emptyResult = await schema['~standard'].validate([]);
    expect(emptyResult.issues).toEqual([
      { path: undefined, message: 'this field must have at least 2 items' },
    ]);

    // Test array too long
    const longResult = await schema['~standard'].validate([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
    expect(longResult.issues).toEqual([
      {
        path: undefined,
        message: 'this field must have less than or equal to 4 items',
      },
    ]);
  });

  test('should handle required array validation', async () => {
    const schema = array(string()).required();

    const result = await schema['~standard'].validate(undefined);
    expect(result.issues).toEqual([
      { path: undefined, message: 'this is a required field' },
    ]);
  });

  test('array validation should produce same errors as main API', async () => {
    const schema = array(string().required()).min(2);
    const testValue = ['valid', ''];

    // Test with standard schema
    const standardResult = await schema['~standard'].validate(testValue);

    // Test with main API
    let mainAPIError: any;
    try {
      await schema.validate(testValue, { abortEarly: false });
    } catch (err) {
      mainAPIError = err;
    }

    // Compare error messages
    expect(standardResult.issues).toBeDefined();
    expect(mainAPIError).toBeDefined();
    expect(standardResult.issues?.length).toBe(mainAPIError.inner.length);

    const standardMessages = standardResult.issues
      ?.map((issue) => issue.message)
      .sort();
    const mainMessages = mainAPIError.inner
      .map((err: any) => err.message)
      .sort();
    expect(standardMessages).toEqual(mainMessages);
  });
});

describe('Object schema standard interface tests', () => {
  test('should handle basic object validation', async () => {
    const schema = object({
      name: string().required(),
      age: number().required().min(0),
    });

    // Test with valid object
    const validResult = await schema['~standard'].validate({
      name: 'John',
      age: 25,
    });
    if (!validResult.issues) {
      expect(validResult.value).toEqual({ name: 'John', age: 25 });
    }

    // Test with invalid object
    const invalidResult = await schema['~standard'].validate({
      name: '',
      age: -1,
    });
    expect(invalidResult.issues).toBeDefined();
    expect(invalidResult.issues).toEqual(
      expect.arrayContaining([
        { path: ['name'], message: 'name is a required field' },
        { path: ['age'], message: 'age must be greater than or equal to 0' },
      ]),
    );
  });

  test('should handle nested object validation', async () => {
    const schema = object({
      user: object({
        profile: object({
          name: string().required(),
          email: string().email(),
        }),
      }),
    });

    const invalidResult = await schema['~standard'].validate({
      user: {
        profile: {
          name: '',
          email: 'invalid-email',
        },
      },
    });

    expect(invalidResult.issues).toBeDefined();
    expect(invalidResult.issues).toEqual(
      expect.arrayContaining([
        {
          path: ['user', 'profile', 'name'],
          message: 'user.profile.name is a required field',
        },
        {
          path: ['user', 'profile', 'email'],
          message: 'user.profile.email must be a valid email',
        },
      ]),
    );
  });

  test('should handle object with array fields', async () => {
    const schema = object({
      tags: array(string().required()).min(1),
      metadata: object({
        version: number().required(),
      }).required(),
    });

    const invalidResult = await schema['~standard'].validate({
      tags: [],
      metadata: null,
    });

    expect(invalidResult.issues).toBeDefined();
    expect(invalidResult.issues).toEqual(
      expect.arrayContaining([
        { path: ['tags'], message: 'tags field must have at least 1 items' },
        { path: ['metadata'], message: 'metadata is a required field' },
      ]),
    );
  });

  test('object validation should produce same errors as main API', async () => {
    const schema = object({
      email: string().email().required(),
      age: number().min(18).required(),
      profile: object({
        bio: string().max(100),
      }),
    });

    const testValue = {
      email: 'invalid-email',
      age: 16,
      profile: {
        bio: 'x'.repeat(150),
      },
    };

    // Test with standard schema
    const standardResult = await schema['~standard'].validate(testValue);

    // Test with main API
    let mainAPIError: any;
    try {
      await schema.validate(testValue, { abortEarly: false });
    } catch (err) {
      mainAPIError = err;
    }

    // Compare error messages
    expect(standardResult.issues).toBeDefined();
    expect(mainAPIError).toBeDefined();
    expect(standardResult.issues?.length).toBe(mainAPIError.inner.length);

    const standardMessages = standardResult.issues
      ?.map((issue) => issue.message)
      .sort();
    const mainMessages = mainAPIError.inner
      .map((err: any) => err.message)
      .sort();
    expect(standardMessages).toEqual(mainMessages);
  });
});

describe('Lazy schema standard interface tests', () => {
  test('should handle conditional lazy schema validation', async () => {
    const schema = lazy((value: any) => {
      if (typeof value === 'string') {
        return string().min(5);
      }
      if (typeof value === 'number') {
        return number().max(100);
      }
      return mixed().required();
    });

    // Test string validation
    const stringResult = await schema['~standard'].validate('abc');
    expect(stringResult.issues).toEqual([
      { path: undefined, message: 'this must be at least 5 characters' },
    ]);

    // Test number validation
    const numberResult = await schema['~standard'].validate(150);
    expect(numberResult.issues).toEqual([
      { path: undefined, message: 'this must be less than or equal to 100' },
    ]);

    // Test successful validation
    const validStringResult = await schema['~standard'].validate('hello world');
    if (!validStringResult.issues) {
      expect(validStringResult.value).toBe('hello world');
    }
  });

  test('should handle lazy schema with object validation', async () => {
    const schema = lazy((value: any) => {
      if (value?.type === 'user') {
        return object({
          type: string().oneOf(['user']),
          name: string().required(),
          email: string().email().required(),
        });
      }
      if (value?.type === 'admin') {
        return object({
          type: string().oneOf(['admin']),
          name: string().required(),
          permissions: array(string()).min(1),
        });
      }
      return object({
        type: string().required(),
      });
    });

    // Test user validation
    const userResult = await schema['~standard'].validate({
      type: 'user',
      name: '',
      email: 'invalid',
    });

    expect(userResult.issues).toBeDefined();
    expect(userResult.issues).toEqual(
      expect.arrayContaining([
        { path: ['name'], message: 'name is a required field' },
        { path: ['email'], message: 'email must be a valid email' },
      ]),
    );

    // Test admin validation
    const adminResult = await schema['~standard'].validate({
      type: 'admin',
      name: 'Admin User',
      permissions: [],
    });

    expect(adminResult.issues).toEqual([
      {
        path: ['permissions'],
        message: 'permissions field must have at least 1 items',
      },
    ]);
  });

  test('lazy validation should produce same errors as main API', async () => {
    const schema = lazy((value: any) => {
      if (Array.isArray(value)) {
        return array(string().required()).min(2);
      }
      return string().required().min(5);
    });

    const testValue = ['valid', ''];

    // Test with standard schema
    const standardResult = await schema['~standard'].validate(testValue);

    // Test with main API
    let mainAPIError: any;
    try {
      await schema.validate(testValue, { abortEarly: false });
    } catch (err) {
      mainAPIError = err;
    }

    // Compare error messages
    expect(standardResult.issues).toBeDefined();
    expect(mainAPIError).toBeDefined();
    expect(standardResult.issues?.length).toBe(mainAPIError.inner.length);

    const standardMessages = standardResult.issues
      ?.map((issue) => issue.message)
      .sort();
    const mainMessages = mainAPIError.inner
      .map((err: any) => err.message)
      .sort();
    expect(standardMessages).toEqual(mainMessages);
  });
});

describe('Complex nested validation comparisons', () => {
  test('should handle deeply nested structure validation identically', async () => {
    const schema = object({
      users: array(
        object({
          id: number().required().positive(),
          profile: object({
            name: string().required().min(2),
            contact: object({
              email: string().email().required(),
              phone: string().matches(/^\d{10}$/, 'Phone must be 10 digits'),
            }),
          }),
          preferences: array(string()).max(5),
        }),
      ).min(1),
      metadata: object({
        version: string().required(),
        tags: array(string().required()).min(1),
      }),
    });

    const testValue = {
      users: [
        {
          id: -1,
          profile: {
            name: 'A',
            contact: {
              email: 'invalid-email',
              phone: '123',
            },
          },
          preferences: ['a', 'b', 'c', 'd', 'e', 'f'],
        },
      ],
      metadata: {
        version: '',
        tags: [],
      },
    };

    // Test with standard schema
    const standardResult = await schema['~standard'].validate(testValue);

    // Test with main API
    let mainAPIError: any;
    try {
      await schema.validate(testValue, { abortEarly: false });
    } catch (err) {
      mainAPIError = err;
    }

    // Both should have errors
    expect(standardResult.issues).toBeDefined();
    expect(mainAPIError).toBeDefined();

    // Compare error counts
    expect(standardResult.issues?.length).toBe(mainAPIError.inner.length);

    // Compare error messages (order might differ, so sort them)
    const standardMessages = standardResult.issues
      ?.map((issue) => issue.message)
      .sort();
    const mainMessages = mainAPIError.inner
      .map((err: any) => err.message)
      .sort();
    expect(standardMessages).toEqual(mainMessages);

    // Verify specific error paths exist
    const standardPaths = standardResult.issues?.map((issue) =>
      issue.path ? issue.path.join('.') : undefined,
    );
    expect(standardPaths).toContain('users.0.id');
    expect(standardPaths).toContain('users.0.profile.name');
    expect(standardPaths).toContain('users.0.profile.contact.email');
    expect(standardPaths).toContain('users.0.profile.contact.phone');
    expect(standardPaths).toContain('users.0.preferences');
    expect(standardPaths).toContain('metadata.version');
    expect(standardPaths).toContain('metadata.tags');
  });

  test('should handle successful validation identically', async () => {
    const schema = object({
      name: string().required(),
      age: number().min(0).max(120),
      email: string().email(),
      address: object({
        street: string(),
        city: string().required(),
        zipCode: string().matches(/^\d{5}$/),
      }),
      hobbies: array(string()).max(10),
    });

    const validValue = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        zipCode: '12345',
      },
      hobbies: ['reading', 'swimming'],
    };

    // Test with standard schema
    const standardResult = await schema['~standard'].validate(validValue);

    // Test with main API
    const mainResult = await schema.validate(validValue);

    // Both should succeed
    expect(standardResult.issues).toBeUndefined();
    if (!standardResult.issues) {
      expect(standardResult.value).toEqual(mainResult);
    }
  });
});

describe('Error message consistency tests', () => {
  test('should produce identical error messages for string validations', async () => {
    const schema = string().required().min(5).max(10).email();
    const testValue = 'abc';

    const standardResult = await schema['~standard'].validate(testValue);

    let mainAPIError: any;
    try {
      await schema.validate(testValue, { abortEarly: false });
    } catch (err) {
      mainAPIError = err;
    }

    expect(standardResult.issues?.map((issue) => issue.message).sort()).toEqual(
      mainAPIError.inner.map((err: any) => err.message).sort(),
    );
  });

  test('should produce identical error messages for number validations', async () => {
    const schema = number().required().min(10).max(100).integer();
    const testValue = 5.5;

    const standardResult = await schema['~standard'].validate(testValue);

    let mainAPIError: any;
    try {
      await schema.validate(testValue, { abortEarly: false });
    } catch (err) {
      mainAPIError = err;
    }

    expect(standardResult.issues?.map((issue) => issue.message).sort()).toEqual(
      mainAPIError.inner.map((err: any) => err.message).sort(),
    );
  });

  test('should handle transform behavior consistently', async () => {
    const schema = object({
      name: string().trim().lowercase(),
      age: number(),
      active: bool(),
    });

    const testValue = {
      name: '  JOHN DOE  ',
      age: '25',
      active: 'true',
    };

    // Test with standard schema
    const standardResult = await schema['~standard'].validate(testValue);

    // Test with main API
    const mainResult = await schema.validate(testValue);

    // Both should succeed and produce same transformed values
    expect(standardResult.issues).toBeUndefined();
    if (!standardResult.issues) {
      expect(standardResult.value).toEqual(mainResult);
      expect(standardResult.value).toEqual({
        name: 'john doe',
        age: 25,
        active: true,
      });
    }
  });
});
