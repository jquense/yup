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

      // expect(() => schema.cast(['James'])).toThrowError(
      //   'this tuple value has too few items, expected a length of 2 but got 1 for value',
      // );
      await expect(schema.validate(['James'])).rejects.toThrowError(
        'this tuple value has too few items, expected a length of 2 but got 1 for value',
      );

      await expect(schema.validate(['James', 2, 4])).rejects.toThrowError(
        'this tuple value has too many items, expected a length of 2 but got 3 for value',
      );
      // expect(() => schema.validate(['James', 2, 4])).rejects.toThrowError(
      //   'this tuple value has too many items, expected a length of 2 but got 3 for value',
      // );
    });
  });
});
