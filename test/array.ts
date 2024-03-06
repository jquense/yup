import {
  string,
  number,
  object,
  array,
  StringSchema,
  AnySchema,
  ValidationError,
} from '../src';

describe('Array types', () => {
  describe('casting', () => {
    it('should parse json strings', () => {
      expect(array().json().cast('[2,3,5,6]')).toEqual([2, 3, 5, 6]);
    });

    it('should failed casts return input', () => {
      expect(array().cast('asfasf', { assert: false })).toEqual('asfasf');

      expect(array().cast('{}', { assert: false })).toEqual('{}');
    });

    it('should recursively cast fields', () => {
      expect(array().of(number()).cast(['4', '5'])).toEqual([4, 5]);

      expect(array().of(string()).cast(['4', 5, false])).toEqual([
        '4',
        '5',
        'false',
      ]);
    });
  });

  it('should handle DEFAULT', () => {
    expect(array().getDefault()).toBeUndefined();

    expect(
      array()
        .default(() => [1, 2, 3])
        .getDefault(),
    ).toEqual([1, 2, 3]);
  });

  it('should type check', () => {
    let inst = array();

    expect(inst.isType([])).toBe(true);
    expect(inst.isType({})).toBe(false);
    expect(inst.isType('true')).toBe(false);
    expect(inst.isType(NaN)).toBe(false);
    expect(inst.isType(34545)).toBe(false);

    expect(inst.isType(null)).toBe(false);

    expect(inst.nullable().isType(null)).toBe(true);
  });

  it('should cast children', () => {
    expect(array().of(number()).cast(['1', '3'])).toEqual([1, 3]);
  });

  it('should concat subType correctly', async () => {
    expect(array(number()).concat(array()).innerType).toBeDefined();

    let merged = array(number()).concat(array(number().required()));

    const ve = new ValidationError('');
    // expect(ve.toString()).toBe('[object Error]');
    expect(Object.prototype.toString.call(ve)).toBe('[object Error]');
    expect((merged.innerType as AnySchema).type).toBe('number');

    await expect(merged.validateAt('[0]', undefined)).rejects.toThrowError();
  });

  it('should pass options to children', () => {
    expect(
      array(object({ name: string() })).cast([{ id: 1, name: 'john' }], {
        stripUnknown: true,
      }),
    ).toEqual([{ name: 'john' }]);
  });

  describe('validation', () => {
    test.each([
      ['required', undefined, array().required()],
      ['required', null, array().required()],
      ['null', null, array()],
      ['length', [1, 2, 3], array().length(2)],
    ])('Basic validations fail: %s %p', async (_, value, schema) => {
      expect(await schema.isValid(value)).toBe(false);
    });

    test.each([
      ['required', [], array().required()],
      ['nullable', null, array().nullable()],
      ['length', [1, 2, 3], array().length(3)],
    ])('Basic validations pass: %s %p', async (_, value, schema) => {
      expect(await schema.isValid(value)).toBe(true);
    });

    it('should allow undefined', async () => {
      await expect(
        array().of(number().max(5)).isValid(undefined),
      ).resolves.toBe(true);
    });

    it('max should replace earlier tests', async () => {
      expect(await array().max(4).max(10).isValid(Array(5).fill(0))).toBe(true);
    });

    it('min should replace earlier tests', async () => {
      expect(await array().min(10).min(4).isValid(Array(5).fill(0))).toBe(true);
    });

    it('should respect subtype validations', async () => {
      let inst = array().of(number().max(5));

      await expect(inst.isValid(['gg', 3])).resolves.toBe(false);
      await expect(inst.isValid([7, 3])).resolves.toBe(false);

      let value = await inst.validate(['4', 3]);

      expect(value).toEqual([4, 3]);
    });

    it('should prevent recursive casting', async () => {
      // @ts-ignore
      let castSpy = jest.spyOn(StringSchema.prototype, '_cast');

      let value = await array(string()).defined().validate([5]);

      expect(value[0]).toBe('5');

      expect(castSpy).toHaveBeenCalledTimes(1);
      castSpy.mockRestore();
    });
  });

  it('should respect abortEarly', async () => {
    let inst = array()
      .of(object({ str: string().required() }))
      .test('name', 'oops', () => false);

    await expect(inst.validate([{ str: '' }])).rejects.toEqual(
      expect.objectContaining({
        value: [{ str: '' }],
        errors: ['oops'],
      }),
    );

    await expect(
      inst.validate([{ str: '' }], { abortEarly: false }),
    ).rejects.toEqual(
      expect.objectContaining({
        value: [{ str: '' }],
        errors: ['[0].str is a required field', 'oops'],
      }),
    );
  });

  it('should respect disableStackTrace', async () => {
    let inst = array().of(object({ str: string().required() }));

    const data = [{ str: undefined }, { str: undefined }];
    return Promise.all([
      expect(inst.strict().validate(data)).rejects.toHaveProperty('stack'),

      expect(
        inst.strict().validate(data, { disableStackTrace: true }),
      ).rejects.not.toHaveProperty('stack'),
    ]);
  });

  it('should compact arrays', () => {
    let arr = ['', 1, 0, 4, false, null],
      inst = array();

    expect(inst.compact().cast(arr)).toEqual([1, 4]);

    expect(inst.compact((v) => v == null).cast(arr)).toEqual([
      '',
      1,
      0,
      4,
      false,
    ]);
  });

  it('should ensure arrays', () => {
    let inst = array().ensure();

    const a = [1, 4];
    expect(inst.cast(a)).toBe(a);

    expect(inst.cast(null)).toEqual([]);
    // nullable is redundant since this should always produce an array
    // but we want to ensure that null is actually turned into an array
    expect(inst.nullable().cast(null)).toEqual([]);

    expect(inst.cast(1)).toEqual([1]);
    expect(inst.nullable().cast(1)).toEqual([1]);
  });

  it('should pass resolved path to descendants', async () => {
    let value = ['2', '3'];
    let expectedPaths = ['[0]', '[1]'];

    let itemSchema = string().when([], function (_, _s, opts: any) {
      let path = opts.path;
      expect(expectedPaths).toContain(path);
      return string().required();
    });

    await array().of(itemSchema).validate(value);
  });

  it('should maintain array sparseness through validation', async () => {
    let sparseArray = new Array(2);
    sparseArray[1] = 1;
    let value = await array().of(number()).validate(sparseArray);
    expect(0 in sparseArray).toBe(false);
    expect(0 in value!).toBe(false);

    // eslint-disable-next-line no-sparse-arrays
    expect(value).toEqual([, 1]);
  });

  it('should validate empty slots in sparse array', async () => {
    let sparseArray = new Array(2);
    sparseArray[1] = 1;
    await expect(
      array().of(number().required()).isValid(sparseArray),
    ).resolves.toEqual(false);
  });
});
