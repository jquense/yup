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
  addMethod,
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

/**
 * Helper function to get Yup validation error directly without try-catch boilerplate
 */
async function getYupValidationError(
  schema: any,
  value: any,
  options?: any,
): Promise<any> {
  try {
    await schema.validate(value, { abortEarly: false, ...options });
    return null; // No error occurred
  } catch (err) {
    return err; // Return the validation error
  }
}

/**
 * Helper function to compare standard schema validation results with main Yup API
 */
async function expectValidationConsistency(
  schema: any,
  testValue: any,
  shouldBeValid?: boolean,
  expectedMessage?: string,
  options?: any,
) {
  // Test with standard schema
  const standardResult = await schema['~standard'].validate(testValue);

  // Test with main API
  const mainAPIError = await getYupValidationError(schema, testValue, options);

  if (shouldBeValid === true) {
    // Both should succeed
    expect(standardResult.issues).toBeUndefined();
    expect(mainAPIError).toBeNull();
  } else if (shouldBeValid === false) {
    // Both should have errors
    expect(standardResult.issues).toBeDefined();
    expect(mainAPIError).toBeDefined();

    if (expectedMessage) {
      expect(mainAPIError?.message).toEqual(
        expect.stringContaining(expectedMessage),
      );
      expect(standardResult.issues?.[0]?.message).toEqual(
        expect.stringContaining(expectedMessage),
      );
    }
  } else {
    // Original behavior - just compare that both have errors
    expect(standardResult.issues).toBeDefined();
    expect(mainAPIError).toBeDefined();

    // Compare error counts
    expect(standardResult.issues?.length).toBe(mainAPIError.inner.length);

    // Compare error messages (sorted for order independence)
    const standardMessages = standardResult.issues
      ?.map((issue: any) => issue.message)
      .sort();
    const mainMessages = mainAPIError.inner
      .map((err: any) => err.message)
      .sort();
    expect(standardMessages).toEqual(mainMessages);
  }

  return { standardResult, mainAPIError };
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

  const testValue = {
    obj: { foo: '', 'not.obj.nested': '' },
    arr: [{ foo: '', 'not.array.nested': '' }],
  };

  // Use helper function to compare validation consistency
  const { standardResult } = await expectValidationConsistency(
    schema,
    testValue,
  );

  // Verify specific path structures are correct
  expect(standardResult.issues?.map((issue: any) => issue.path)).toEqual(
    expect.arrayContaining([
      ['obj', 'foo'],
      ['obj', 'not.obj.nested'],
      ['arr', '0', 'foo'],
      ['arr', '0', 'not.array.nested'],
      ['not.a.field'],
    ]),
  );
});

test('should clone correctly when using modifiers', async () => {
  const schema = string().required();
  const testValue = '';

  // Use helper function to compare validation consistency
  const { standardResult } = await expectValidationConsistency(
    schema,
    testValue,
  );

  // Verify path is undefined for root-level validation
  expect(standardResult.issues?.[0]?.path).toBeUndefined();
});

test('should work correctly with lazy schemas', async () => {
  let isNumber = false;
  const schema = lazy(() => {
    if (isNumber) {
      return number().min(10);
    }

    return string().required().min(12);
  });

  const testValue1 = '';

  // Use helper function to compare validation consistency for string validation
  const { standardResult: result1 } = await expectValidationConsistency(
    schema,
    testValue1,
  );

  // Verify path is undefined for root-level validation
  expect(result1.issues?.every((issue: any) => issue.path === undefined)).toBe(
    true,
  );

  isNumber = true;

  const testValue2 = 5;

  // Use helper function to compare validation consistency for number validation
  const { standardResult: result2 } = await expectValidationConsistency(
    schema,
    testValue2,
  );

  // Verify path is undefined for root-level validation
  expect(result2.issues?.[0]?.path).toBeUndefined();
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
    const testValue = ['a', { foo: 'bar' }, 'c'];

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific error details
    expect(standardResult.issues?.[0]?.path).toEqual(['1']);
    expect(standardResult.issues?.[0]?.message).toContain(
      'must be a `string` type',
    );
  });

  test('should handle array length validations', async () => {
    const schema = array(string()).min(2).max(4);

    // Test empty array
    const emptyTestValue: string[] = [];

    // Use helper function to compare validation consistency for empty array
    await expectValidationConsistency(schema, emptyTestValue);

    // Test array too long
    const longTestValue = ['a', 'b', 'c', 'd', 'e'];

    // Use helper function to compare validation consistency for long array
    await expectValidationConsistency(schema, longTestValue);
  });

  test('should handle required array validation', async () => {
    const schema = array(string()).required();
    const testValue = undefined;

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify path is undefined for root-level validation
    expect(standardResult.issues?.[0]?.path).toBeUndefined();
  });

  test('array validation should produce same errors as main API', async () => {
    const schema = array(string().required()).min(2);
    const testValue = ['valid', ''];

    // Use helper function to compare validation consistency
    await expectValidationConsistency(schema, testValue);
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
    const testValue = {
      name: '',
      age: -1,
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific error details with flexible matching
    expect(standardResult.issues).toEqual(
      expect.arrayContaining([
        { path: ['name'], message: expect.stringContaining('required') },
        {
          path: ['age'],
          message: expect.stringContaining('greater than or equal to 0'),
        },
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

    const testValue = {
      user: {
        profile: {
          name: '',
          email: 'invalid-email',
        },
      },
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific error details
    expect(standardResult.issues).toEqual(
      expect.arrayContaining([
        {
          path: ['user', 'profile', 'name'],
          message: expect.stringContaining('required'),
        },
        {
          path: ['user', 'profile', 'email'],
          message: expect.stringContaining('valid email'),
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

    const testValue = {
      tags: [],
      metadata: null,
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific error details with more flexible matching
    expect(standardResult.issues).toEqual(
      expect.arrayContaining([
        { path: ['tags'], message: expect.stringContaining('at least 1') },
        { path: ['metadata'], message: expect.stringContaining('required') },
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

    // Use helper function to compare validation consistency
    await expectValidationConsistency(schema, testValue);
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
    const stringTestValue = 'abc';
    const { standardResult: stringResult } = await expectValidationConsistency(
      schema,
      stringTestValue,
    );
    expect(stringResult.issues?.[0]?.path).toBeUndefined();

    // Test number validation
    const numberTestValue = 150;
    const { standardResult: numberResult } = await expectValidationConsistency(
      schema,
      numberTestValue,
    );
    expect(numberResult.issues?.[0]?.path).toBeUndefined();

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
    const userTestValue = {
      type: 'user',
      name: '',
      email: 'invalid',
    };

    const { standardResult: userResult } = await expectValidationConsistency(
      schema,
      userTestValue,
    );

    expect(userResult.issues).toEqual(
      expect.arrayContaining([
        { path: ['name'], message: expect.stringContaining('required') },
        { path: ['email'], message: expect.stringContaining('valid email') },
      ]),
    );

    // Test admin validation
    const adminTestValue = {
      type: 'admin',
      name: 'Admin User',
      permissions: [],
    };

    const { standardResult: adminResult } = await expectValidationConsistency(
      schema,
      adminTestValue,
    );

    expect(adminResult.issues).toEqual([
      {
        path: ['permissions'],
        message: expect.stringContaining('at least 1'),
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

    // Use helper function to compare validation consistency
    await expectValidationConsistency(schema, testValue);
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

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific error paths exist
    const standardPaths = standardResult.issues?.map((issue: any) =>
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

    // Use helper function to compare validation consistency
    await expectValidationConsistency(schema, testValue);
  });

  test('should produce identical error messages for number validations', async () => {
    const schema = number().required().min(10).max(100).integer();
    const testValue = 5.5;

    // Use helper function to compare validation consistency
    await expectValidationConsistency(schema, testValue);
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

describe('Conditional validation tests with when API', () => {
  test('should handle basic conditional validation', async () => {
    const schema = object({
      isMember: bool(),
      membershipId: string().when('isMember', {
        is: true,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
    });

    // Test when condition is true
    const testValue = {
      isMember: true,
      membershipId: '',
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific error details with flexible matching
    expect(standardResult.issues).toEqual([
      { path: ['membershipId'], message: expect.stringContaining('required') },
    ]);

    // Test when condition is false
    const nonMemberResult = await schema['~standard'].validate({
      isMember: false,
      membershipId: '',
    });
    if (!nonMemberResult.issues) {
      expect(nonMemberResult.value).toEqual({
        isMember: false,
        membershipId: '',
      });
    }
  });

  test('should handle conditional validation with function predicate', async () => {
    const schema = object({
      age: number().required(),
      parentalConsent: bool().when('age', {
        is: (age: number) => age < 18,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
    });

    // Test when condition is true (age < 18)
    const testValue = {
      age: 16,
      parentalConsent: undefined,
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific error details
    expect(standardResult.issues).toEqual([
      {
        path: ['parentalConsent'],
        message: expect.stringContaining('required'),
      },
    ]);

    // Test when condition is false (age >= 18)
    const adultResult = await schema['~standard'].validate({
      age: 25,
      parentalConsent: undefined,
    });
    if (!adultResult.issues) {
      expect(adultResult.value).toEqual({
        age: 25,
        parentalConsent: undefined,
      });
    }
  });

  test('should handle multiple conditional dependencies', async () => {
    const schema = object({
      accountType: string().oneOf(['personal', 'business']),
      hasEmployees: bool(),
      employeeCount: number().when(['accountType', 'hasEmployees'], {
        is: (accountType: string, hasEmployees: boolean) =>
          accountType === 'business' && hasEmployees,
        then: (schema) => schema.required().min(1),
        otherwise: (schema) => schema.optional(),
      }),
    });

    // Test when both conditions are met
    const testValue = {
      accountType: 'business',
      hasEmployees: true,
      employeeCount: undefined,
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific error details
    expect(standardResult.issues).toEqual([
      { path: ['employeeCount'], message: expect.stringContaining('required') },
    ]);

    // Test when conditions are not met
    const personalAccountResult = await schema['~standard'].validate({
      accountType: 'personal',
      hasEmployees: false,
      employeeCount: undefined,
    });
    if (!personalAccountResult.issues) {
      expect(personalAccountResult.value).toEqual({
        accountType: 'personal',
        hasEmployees: false,
        employeeCount: undefined,
      });
    }
  });

  test('should handle nested conditional validation', async () => {
    const schema = object({
      shippingMethod: string().oneOf([
        'standard',
        'express',
        'overnight',
        'pickup',
      ]),
      deliveryAddress: object({
        street: string().required(),
        city: string().required(),
        state: string().required(),
        zipCode: string().required(),
        country: string().required(),
      }).when('shippingMethod', {
        is: (method: string) => method !== 'pickup',
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
    });

    // Test with shipping method that requires address but missing address
    const testValue = {
      shippingMethod: 'overnight',
      // deliveryAddress is completely missing
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // When the address is required but missing, we get errors for its required fields
    expect(
      standardResult.issues?.some(
        (issue: any) =>
          issue.path?.join('.') === 'deliveryAddress.street' &&
          issue.message.includes('required'),
      ),
    ).toBe(true);

    // Test with pickup method where address is optional
    const pickupResult = await schema['~standard'].validate({
      shippingMethod: 'pickup',
      // deliveryAddress is optional for pickup
    });

    if (!pickupResult.issues) {
      expect(pickupResult.value).toEqual({
        shippingMethod: 'pickup',
      });
    }
  });

  test('should handle conditional validation with context variables', async () => {
    const schema = object({
      role: string().oneOf(['user', 'admin']),
      permissions: array(string()).when('$userRole', {
        is: 'admin',
        then: (schema) => schema.min(1).required(),
        otherwise: (schema) => schema.optional(),
      }),
    });

    // Test standard schema (doesn't support context, so this should pass)
    const adminStandardResult = await schema['~standard'].validate({
      role: 'user',
      permissions: [],
    });

    // Note: Standard schema doesn't have context, so this should pass
    if (!adminStandardResult.issues) {
      expect(adminStandardResult.value).toEqual({
        role: 'user',
        permissions: [],
      });
    }
  });

  test('conditional validation should produce same errors as main API', async () => {
    const schema = object({
      subscriptionType: string().oneOf(['free', 'premium', 'enterprise']),
      features: array(string()).when('subscriptionType', {
        is: 'free',
        then: (schema) => schema.max(3),
        otherwise: (schema) => schema.max(20),
      }),
      maxUsers: number().when('subscriptionType', {
        is: 'enterprise',
        then: (schema) => schema.required().min(50),
        otherwise: (schema) => schema.optional().max(10),
      }),
    });

    const testValue = {
      subscriptionType: 'enterprise',
      features: Array(25).fill('feature'), // Too many for any plan
      maxUsers: 5, // Too low for enterprise
    };

    // Use helper function to compare validation consistency
    await expectValidationConsistency(schema, testValue);
  });

  test('should handle when with function returning schema', async () => {
    const schema = object({
      userType: string().oneOf(['individual', 'organization']),
      name: string().when('userType', ([userType], schema) => {
        if (userType === 'organization') {
          return schema.required().min(2).max(100);
        }
        return schema.required().min(1).max(50);
      }),
      taxId: string().when('userType', ([userType], schema) => {
        if (userType === 'organization') {
          return schema
            .required()
            .matches(/^\d{2}-\d{7}$/, 'Tax ID must be in format XX-XXXXXXX');
        }
        return schema.optional();
      }),
    });

    // Test organization validation
    const testValue = {
      userType: 'organization',
      name: 'A', // Too short for organization
      taxId: 'invalid-format',
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific error details with flexible matching
    expect(standardResult.issues).toEqual(
      expect.arrayContaining([
        { path: ['name'], message: expect.stringContaining('at least 2') },
        {
          path: ['taxId'],
          message: expect.stringContaining('Tax ID must be in format'),
        },
      ]),
    );

    // Test individual validation
    const individualResult = await schema['~standard'].validate({
      userType: 'individual',
      name: 'John Doe',
      taxId: undefined,
    });

    if (!individualResult.issues) {
      expect(individualResult.value).toEqual({
        userType: 'individual',
        name: 'John Doe',
        taxId: undefined,
      });
    }
  });

  test('should handle complex conditional chains', async () => {
    const schema = object({
      eventType: string().oneOf(['conference', 'workshop', 'webinar']),
      isVirtual: bool(),
      location: string().when(['eventType', 'isVirtual'], {
        is: (eventType: string, isVirtual: boolean) =>
          eventType !== 'webinar' && !isVirtual,
        then: (schema) => schema.required().min(5),
        otherwise: (schema) => schema.optional(),
      }),
      platformUrl: string()
        .url()
        .when('isVirtual', {
          is: true,
          then: (schema) => schema.required(),
          otherwise: (schema) => schema.optional(),
        }),
      capacity: number()
        .min(1)
        .when('eventType', {
          is: 'conference',
          then: (schema) => schema.min(50).required(),
          otherwise: (schema) => schema.max(100).optional(),
        }),
    });

    const testValue = {
      eventType: 'conference',
      isVirtual: false,
      location: '', // Required but empty
      platformUrl: '', // Not required but invalid URL if provided
      capacity: 10, // Too low for conference
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      schema,
      testValue,
    );

    // Verify specific conditional errors
    const standardPaths = standardResult.issues?.map((issue: any) =>
      issue.path ? issue.path.join('.') : undefined,
    );
    expect(standardPaths).toContain('location');
    expect(standardPaths).toContain('capacity');
  });
});

describe('Concat API standard interface tests', () => {
  test('should handle string schema concatenation', async () => {
    const baseSchema = string().required();
    const extendedSchema = string().min(5).max(20);
    const concatenatedSchema = baseSchema.concat(extendedSchema);

    // Test with invalid value that violates both base and extended rules
    const testValue = '';

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      concatenatedSchema,
      testValue,
    );

    // Verify that concatenated schema produces errors for all combined rules
    expect(standardResult.issues?.length).toBeGreaterThan(0);
    expect(standardResult.issues?.[0]?.path).toBeUndefined(); // Root level validation
  });

  test('should handle number schema concatenation', async () => {
    const baseSchema = number().required().min(0);
    const extendedSchema = number().max(100).integer();
    const concatenatedSchema = baseSchema.concat(extendedSchema);

    // Test with invalid value that violates extended rules
    const testValue = 150.5;

    // Use helper function to compare validation consistency
    await expectValidationConsistency(concatenatedSchema, testValue);
  });

  test('should handle object schema concatenation', async () => {
    const baseSchema = object({
      name: string().required(),
      email: string().email(),
    });

    const extendedSchema = object({
      age: number().required().min(18),
      phone: string().matches(/^\d{10}$/, 'Phone must be 10 digits'),
    });

    const concatenatedSchema = baseSchema.concat(extendedSchema);

    // Test with value that has errors in both base and extended fields
    const testValue = {
      name: '', // Violates base schema
      email: 'invalid-email', // Violates base schema
      age: 16, // Violates extended schema
      phone: '123', // Violates extended schema
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      concatenatedSchema,
      testValue,
    );

    // Verify that all fields from both schemas are validated
    const errorPaths = standardResult.issues?.map(
      (issue: any) => issue.path?.[0],
    );
    expect(errorPaths).toContain('name');
    expect(errorPaths).toContain('email');
    expect(errorPaths).toContain('age');
    expect(errorPaths).toContain('phone');
  });

  test('should handle array schema concatenation', async () => {
    const baseSchema = array(string()).required();
    const extendedSchema = array().min(2).max(5);
    const concatenatedSchema = baseSchema.concat(extendedSchema);

    // Test with array that violates extended rules
    const testValue = ['single-item']; // Less than min length

    // Use helper function to compare validation consistency
    await expectValidationConsistency(concatenatedSchema, testValue);
  });

  test('should handle concat with conditional validation', async () => {
    const baseSchema = object({
      type: string().oneOf(['user', 'admin']),
      name: string().required(),
    });

    const extendedSchema = object({
      permissions: array(string()).when('type', {
        is: 'admin',
        then: (schema) => schema.required().min(1),
        otherwise: (schema) => schema.optional(),
      }),
    });

    const concatenatedSchema = baseSchema.concat(extendedSchema);

    // Test admin type without permissions
    const testValue = {
      type: 'admin',
      name: 'Admin User',
      permissions: [], // Should be required and non-empty for admin
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      concatenatedSchema,
      testValue,
    );

    // Verify conditional validation works in concatenated schema
    expect(standardResult.issues).toEqual([
      {
        path: ['permissions'],
        message: expect.stringContaining('at least 1'),
      },
    ]);
  });

  test('should handle concat with transforms', async () => {
    const baseSchema = object({
      name: string().trim(),
      email: string().lowercase(),
    });

    const extendedSchema = object({
      age: number(),
      active: bool(),
    });

    const concatenatedSchema = baseSchema.concat(extendedSchema);

    // Test with transformable values
    const testValue = {
      name: '  John Doe  ',
      email: 'JOHN@EXAMPLE.COM',
      age: '25',
      active: 'true',
    };

    // Test with standard schema
    const standardResult = await concatenatedSchema['~standard'].validate(
      testValue,
    );

    // Test with main API
    const mainResult = await concatenatedSchema.validate(testValue);

    // Both should succeed and produce same transformed values
    expect(standardResult.issues).toBeUndefined();
    if (!standardResult.issues) {
      expect(standardResult.value).toEqual(mainResult);
      expect(standardResult.value).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        active: true,
      });
    }
  });

  test('should handle multiple concat operations', async () => {
    const baseSchema = string().required();
    const firstExtension = string().min(3);
    const secondExtension = string().max(10);
    const thirdExtension = string().matches(
      /^[A-Z]/,
      'Must start with uppercase letter',
    );

    const concatenatedSchema = baseSchema
      .concat(firstExtension)
      .concat(secondExtension)
      .concat(thirdExtension);

    // Test with value that violates multiple rules
    const testValue = 'ab'; // Too short and doesn't start with uppercase

    // Use helper function to compare validation consistency
    await expectValidationConsistency(concatenatedSchema, testValue);
  });

  test('should handle concat with nested object schemas', async () => {
    const baseSchema = object({
      user: object({
        name: string().required(),
        email: string().email(),
      }),
    });

    const extendedSchema = object({
      user: object({
        age: number().min(18),
        phone: string().required(),
      }),
      metadata: object({
        createdAt: date().required(),
      }),
    });

    const concatenatedSchema = baseSchema.concat(extendedSchema);

    // Test with nested validation errors
    const testValue = {
      user: {
        name: '',
        email: 'invalid-email',
        age: 16,
        phone: '',
      },
      metadata: {
        createdAt: null,
      },
    };

    // Use helper function to compare validation consistency
    const { standardResult } = await expectValidationConsistency(
      concatenatedSchema,
      testValue,
    );

    // With object concat, the extended schema typically overrides the base schema fields
    // So we mainly check for the extended schema fields and metadata
    const errorPaths = standardResult.issues?.map((issue: any) =>
      issue.path ? issue.path.join('.') : undefined,
    );
    expect(errorPaths).toContain('user.age');
    expect(errorPaths).toContain('user.phone');
    expect(errorPaths).toContain('metadata.createdAt');
  });

  test('should handle concat with mixed schema types', async () => {
    const baseSchema = object({
      value: mixed().required(),
    });

    const extendedSchema = object({
      value: mixed().test('custom', 'Value must be positive', (value: any) => {
        return typeof value === 'number' ? value > 0 : true;
      }),
      description: string().optional(),
    });

    const concatenatedSchema = baseSchema.concat(extendedSchema);

    // Test with negative number (violates custom test)
    const testValue = {
      value: -5,
      description: 'A negative value',
    };

    // Use helper function to compare validation consistency
    await expectValidationConsistency(concatenatedSchema, testValue);
  });

  test('should handle successful concat validation', async () => {
    const baseSchema = object({
      name: string().required(),
      email: string().email().required(),
    });

    const extendedSchema = object({
      age: number().min(18).max(120),
      newsletter: bool().default(false),
    });

    const concatenatedSchema = baseSchema.concat(extendedSchema);

    // Test with valid data
    const validValue = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      newsletter: true,
    };

    // Test with standard schema
    const standardResult = await concatenatedSchema['~standard'].validate(
      validValue,
    );

    // Test with main API
    const mainResult = await concatenatedSchema.validate(validValue);

    // Both should succeed
    expect(standardResult.issues).toBeUndefined();
    if (!standardResult.issues) {
      expect(standardResult.value).toEqual(mainResult);
    }
  });
});

describe('AddMethod API standard interface tests', () => {
  beforeAll(() => {
    // Add custom methods to string schema
    addMethod(string, 'isUpperCase', function (message = 'Must be uppercase') {
      return this.test('isUpperCase', message, function (value: any) {
        return value == null || value === value.toUpperCase();
      });
    });

    addMethod(
      string,
      'hasMinWords',
      function (minWords: number, message?: string) {
        const defaultMessage = `Must have at least ${minWords} words`;
        return this.test(
          'hasMinWords',
          message || defaultMessage,
          function (value: any) {
            if (value == null) return true;
            return value.trim().split(/\s+/).length >= minWords;
          },
        );
      },
    );

    addMethod(
      string,
      'startsWithCapital',
      function (message = 'Must start with capital letter') {
        return this.test('startsWithCapital', message, function (value: any) {
          return value == null || /^[A-Z]/.test(value);
        });
      },
    );

    addMethod(
      string,
      'endsWithPeriod',
      function (message = 'Must end with period') {
        return this.test('endsWithPeriod', message, function (value: any) {
          return value == null || value.endsWith('.');
        });
      },
    );

    // Add custom methods to number schema
    addMethod(number, 'isEven', function (message = 'Must be an even number') {
      return this.test('isEven', message, function (value: any) {
        return value == null || value % 2 === 0;
      });
    });

    addMethod(
      number,
      'isPositiveWhenDefined',
      function (message = 'Must be positive when defined') {
        return this.test(
          'isPositiveWhenDefined',
          message,
          function (value: any) {
            return value == null || value > 0;
          },
        );
      },
    );

    // Add custom methods to object schema
    addMethod(
      object,
      'hasRequiredFields',
      function (fields: string[], message = 'Missing required fields') {
        return this.test('hasRequiredFields', message, function (value: any) {
          if (value == null) return true;
          return fields.every((field) =>
            Object.prototype.hasOwnProperty.call(value, field),
          );
        });
      },
    ); // Add custom methods to array schema
    addMethod(
      array,
      'hasNoDuplicates',
      function (message = 'Array must not contain duplicates') {
        return this.test('hasNoDuplicates', message, function (value: any) {
          if (value == null) return true;
          return new Set(value).size === value.length;
        });
      },
    );

    // Add custom methods to mixed schema
    addMethod(
      mixed,
      'isNotEmpty',
      function (message = 'Value cannot be empty') {
        return this.test('isNotEmpty', message, function (value: any) {
          if (value == null) return false;
          if (typeof value === 'string') return value.trim().length > 0;
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'object') return Object.keys(value).length > 0;
          return true;
        });
      },
    );
  });

  it('should maintain validation consistency with basic string addMethod', async () => {
    const customStringSchema = (string().nullable() as any).isUpperCase();

    const validValues = ['HELLO', 'WORLD', 'TEST', '', undefined, null];
    const invalidValues = ['hello', 'Hello', 'HELLO world', 'test'];

    for (const value of validValues) {
      await expectValidationConsistency(customStringSchema, value, true);
    }

    for (const value of invalidValues) {
      await expectValidationConsistency(
        customStringSchema,
        value,
        false,
        'Must be uppercase',
      );
    }
  });

  it('should maintain validation consistency with number addMethod', async () => {
    const customNumberSchema = (number().nullable() as any).isEven();

    const validValues = [2, 4, 6, 0, -2, undefined, null];
    const invalidValues = [1, 3, 5, -1, 7.5];

    for (const value of validValues) {
      await expectValidationConsistency(customNumberSchema, value, true);
    }

    for (const value of invalidValues) {
      await expectValidationConsistency(
        customNumberSchema,
        value,
        false,
        'Must be an even number',
      );
    }
  });

  it('should maintain validation consistency with object addMethod', async () => {
    const customObjectSchema = (object().nullable() as any).hasRequiredFields([
      'name',
      'email',
    ]);

    const validValues = [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com', age: 30 },
      undefined,
      null,
    ];
    const invalidValues = [
      { name: 'John' },
      { email: 'john@example.com' },
      { age: 30 },
      {},
    ];

    for (const value of validValues) {
      await expectValidationConsistency(customObjectSchema, value, true);
    }

    for (const value of invalidValues) {
      await expectValidationConsistency(
        customObjectSchema,
        value,
        false,
        'Missing required fields',
      );
    }
  });

  it('should maintain validation consistency with array addMethod', async () => {
    const customArraySchema = (array().nullable() as any).hasNoDuplicates();

    const validValues = [[1, 2, 3], ['a', 'b', 'c'], [], [1], undefined, null];
    const invalidValues = [
      [1, 2, 2],
      ['a', 'b', 'a'],
      [1, 1, 2, 3],
    ];

    for (const value of validValues) {
      await expectValidationConsistency(customArraySchema, value, true);
    }

    for (const value of invalidValues) {
      await expectValidationConsistency(
        customArraySchema,
        value,
        false,
        'Array must not contain duplicates',
      );
    }
  });

  it('should maintain validation consistency with chained addMethod', async () => {
    const customStringSchema = (string().nullable() as any)
      .startsWithCapital()
      .endsWithPeriod();

    const validValues = ['Hello world.', 'Test.', 'A.', undefined, null];
    const invalidValues = ['hello world.', 'Test', 'Hello world', 'a.'];

    for (const value of validValues) {
      await expectValidationConsistency(customStringSchema, value, true);
    }

    for (const value of invalidValues) {
      await expectValidationConsistency(customStringSchema, value, false);
    }
  });

  it('should maintain validation consistency with parameterized addMethod', async () => {
    const customStringSchema = (string().nullable() as any).hasMinWords(3);

    const validValues = [
      'hello world test',
      'one two three',
      'a b c d',
      undefined,
      null,
    ];
    const invalidValues = ['hello', 'hello world', '', '  '];

    for (const value of validValues) {
      await expectValidationConsistency(customStringSchema, value, true);
    }

    for (const value of invalidValues) {
      await expectValidationConsistency(
        customStringSchema,
        value,
        false,
        'Must have at least 3 words',
      );
    }
  });

  it('should maintain validation consistency with addMethod on mixed schema', async () => {
    const customMixedSchema = (mixed().nullable() as any).isNotEmpty();

    const validValues = ['hello', 123, [1, 2], { a: 1 }, true];
    const invalidValues = ['', '  ', [], {}, null, undefined];

    for (const value of validValues) {
      await expectValidationConsistency(customMixedSchema, value, true);
    }

    for (const value of invalidValues) {
      await expectValidationConsistency(
        customMixedSchema,
        value,
        false,
        'Value cannot be empty',
      );
    }
  });

  it('should maintain validation consistency with addMethod and conditional logic', async () => {
    const customNumberSchema = (
      number().nullable() as any
    ).isPositiveWhenDefined();

    // Test without conditional logic first
    const validValues = [1, 5.5, 100, undefined, null];
    const invalidValues = [0, -1, -5.5];

    for (const value of validValues) {
      await expectValidationConsistency(customNumberSchema, value, true);
    }

    for (const value of invalidValues) {
      await expectValidationConsistency(
        customNumberSchema,
        value,
        false,
        'Must be positive when defined',
      );
    }
  });

  it('should maintain validation consistency with multiple custom methods', async () => {
    const complexSchema = (string().nullable() as any)
      .isUpperCase('Must be uppercase')
      .hasMinWords(2, 'Must have at least 2 words');

    const validValues = ['HELLO WORLD', 'TEST CASE', 'A B', undefined, null];
    const invalidValues = [
      'hello world', // not uppercase
      'HELLO', // not enough words
      'hello', // both violations
      '', // not enough words
      'HELLO world', // not uppercase
    ];

    for (const value of validValues) {
      await expectValidationConsistency(complexSchema, value, true);
    }

    for (const value of invalidValues) {
      await expectValidationConsistency(complexSchema, value, false);
    }
  });

  it('should maintain validation consistency with addMethod cast behavior', async () => {
    // Test that custom methods work with casting
    const customStringSchema = (string().nullable() as any).isUpperCase();

    // Test casting behavior
    expect(customStringSchema.cast(123)).toBe('123');
    expect(customStringSchema.cast(true)).toBe('true');

    // Test that casting works correctly with validation
    const castValue = customStringSchema.cast('TEST');
    expect(castValue).toBe('TEST');
    await expectValidationConsistency(customStringSchema, 'TEST', true);

    // Test that non-uppercase strings still fail validation even after casting
    const nonUpperCase = customStringSchema.cast('hello');
    expect(nonUpperCase).toBe('hello');
    await expectValidationConsistency(
      customStringSchema,
      'hello',
      false,
      'Must be uppercase',
    );
  });
});
