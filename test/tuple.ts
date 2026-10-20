import { describe, it, expect, test } from 'vitest';
import { string, number, object, tuple, mixed } from '../src';

describe('Array types', () => {
  describe('casting', () => {
    it('should failed casts return input', () => {
      expect(
        tuple([number(), number()]).cast('asfasf', { assert: false }),
      ).toEqual('asfasf');
    });

    it('should recursively cast fields', () => {
      expect(tuple([number(), number()]).cast(['4', '5'])).toEqual([4, 5]);

      expect(
        tuple([string(), string(), string()]).cast(['4', 5, false]),
      ).toEqual(['4', '5', 'false']);
    });

    it('should pass array options to descendants when casting', async () => {
      let value = ['1', '2'];
  
      let itemSchema = string().when([], function (_, _s, opts: any) {
  
        const parent = opts.parent;
        const idx = opts.index;
        const val = opts.value;
        const originalValue = opts.originalValue;
        
        expect(parent).toEqual(value);
        expect(typeof idx).toBe('number');
        expect(val).toEqual(parent[idx]);
        expect(originalValue).toEqual(parent[idx]);
  
        return string();
      });

      await tuple([itemSchema, itemSchema]).validate(value);
    });
  });

  it('should handle DEFAULT', () => {
    expect(tuple([number(), number(), number()]).getDefault()).toBeUndefined();

    expect(
      tuple([number(), number(), number()])
        .default(() => [1, 2, 3])
        .getDefault(),
    ).toEqual([1, 2, 3]);
  });

  it('should type check', () => {
    let inst = tuple([number()]);

    expect(inst.isType([1])).toBe(true);
    expect(inst.isType({})).toBe(false);
    expect(inst.isType('true')).toBe(false);
    expect(inst.isType(NaN)).toBe(false);
    expect(inst.isType(34545)).toBe(false);

    expect(inst.isType(null)).toBe(false);

    expect(inst.nullable().isType(null)).toBe(true);
  });

  it('should pass options to children', () => {
    expect(
      tuple([object({ name: string() })]).cast([{ id: 1, name: 'john' }], {
        stripUnknown: true,
      }),
    ).toEqual([{ name: 'john' }]);
  });

  describe('validation', () => {
    it('should validate tuple defaults when the input is undefined', async () => {
      const schema = tuple([number().required(), string().required()]).default([
        1,
        'hello',
      ]);

      expect(schema.validateSync(undefined)).toEqual([1, 'hello']);
      await expect(schema.validate(undefined)).resolves.toEqual([1, 'hello']);
      await expect(schema.isValid(undefined)).resolves.toBe(true);
    });

    it('should report validation errors for invalid tuple defaults', async () => {
      const schema = tuple([number().min(2), string().required()]).default([
        1,
        '',
      ]);

      await expect(
        schema.validate(undefined, { abortEarly: false }),
      ).rejects.toMatchObject({
        errors: [
          '[0] must be greater than or equal to 2',
          '[1] is a required field',
        ],
      });
      expect(schema.isValidSync(undefined)).toBe(false);
    });

    it('should preserve original tuple values for nested tests', async () => {
      const schema = tuple([
        number().test('original', 'original value was lost', function (value) {
          return value === 1 && this.originalValue === '1';
        }),
      ]);

      await expect(schema.validate(['1'])).resolves.toEqual([1]);
    });

    test.each([
      ['required', undefined, tuple([mixed()]).required()],
      ['required', null, tuple([mixed()]).required()],
      ['null', null, tuple([mixed()])],
    ])('Basic validations fail: %s %p', async (_, value, schema) => {
      expect(await schema.isValid(value)).toBe(false);
    });

    test.each([
      ['required', ['any'], tuple([mixed()]).required()],
      ['nullable', null, tuple([mixed()]).nullable()],
    ])('Basic validations pass: %s %p', async (_, value, schema) => {
      expect(await schema.isValid(value)).toBe(true);
    });

    it('should allow undefined', async () => {
      await expect(
        tuple([number().defined()]).isValid(undefined),
      ).resolves.toBe(true);
    });

    it('should respect subtype validations', async () => {
      let inst = tuple([number().max(5), string()]);

      await expect(inst.isValid(['gg', 'any'])).resolves.toBe(false);
      await expect(inst.isValid([7, 3])).resolves.toBe(false);

      expect(await inst.validate(['4', 3])).toEqual([4, '3']);
    });

    it('should use labels', async () => {
      let schema = tuple([
        string().label('name'),
        number().positive().integer().label('age'),
      ]);

      await expect(schema.validate(['James', -24.55])).rejects.toThrow(
        'age must be a positive number',
      );
    });

    it('should throw useful type error for length', async () => {
      let schema = tuple([string().label('name'), number().label('age')]);

      await expect(schema.validate(['James'])).rejects.toThrowError(
        'this tuple value has too few items, expected a length of 2 but got 1 for value',
      );

      await expect(schema.validate(['James', 2, 4])).rejects.toThrowError(
        'this tuple value has too many items, expected a length of 2 but got 3 for value',
      );
    });
  });
});
