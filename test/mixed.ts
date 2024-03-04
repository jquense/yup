import {
  array,
  bool,
  lazy,
  mixed,
  number,
  object,
  reach,
  ref,
  Schema,
  string,
  tuple,
  ValidationError,
} from '../src';
import ObjectSchema from '../src/object';
import { ISchema } from '../src/types';
import { ensureSync, validateAll } from './helpers';

let noop = () => {};

// @ts-ignore
global.YUP_USE_SYNC &&
  it('[internal] normal methods should be running in sync Mode', async () => {
    let schema = number();

    // test negative ensure case
    await expect(ensureSync(() => Promise.resolve())).rejects.toThrowError(
      'Did not execute synchronously',
    );

    // test positive case
    await expect(ensureSync(() => schema.isValid(1))).resolves.toBe(true);

    // ensure it fails with the correct message in sync mode
    await expect(
      ensureSync(() => schema.validate('john')),
    ).rejects.toThrowError(
      /the final value was: `NaN`.+cast from the value `"john"`/,
    );
  });

describe('Mixed Types ', () => {
  it('is not nullable by default', async () => {
    let inst = mixed();

    await expect(inst.isValid(null)).resolves.toBe(false);
    await expect(inst.nullable().isValid(null)).resolves.toBe(true);
  });

  it('cast should return a default when undefined', () => {
    let inst = mixed().default('hello');

    expect(inst.cast(undefined)).toBe('hello');
  });

  it('getDefault should return the default value', function () {
    let inst = string().default('hi');
    expect(inst.getDefault({})).toBe('hi');
    expect(inst.getDefault()).toBe('hi');
  });

  it('getDefault should return the default value using context', function () {
    let inst = string().when('$foo', {
      is: 'greet',
      then: (s) => s.default('hi'),
    });
    expect(inst.getDefault({ context: { foo: 'greet' } })).toBe('hi');
  });

  it('should use provided check', async () => {
    let schema = mixed((v): v is string => typeof v === 'string');

    // @ts-expect-error narrowed type
    schema.default(1);

    expect(schema.isType(1)).toBe(false);
    expect(schema.isType('foo')).toBe(true);

    await expect(schema.validate(1)).rejects.toThrowError(
      /this must match the configured type\. The validated value was: `1`/,
    );

    schema = mixed({
      type: 'string',
      check: (v): v is string => typeof v === 'string',
    });

    // @ts-expect-error narrowed type
    schema.default(1);

    expect(schema.isType(1)).toBe(false);
    expect(schema.isType('foo')).toBe(true);

    await expect(schema.validate(1)).rejects.toThrowError(
      /this must be a `string` type/,
    );
  });

  it('should allow missing values with the "ignore-optionality" option', () => {
    expect(
      string().required().cast(null, { assert: 'ignore-optionality' }),
    ).toBe(null);

    expect(
      string().required().cast(undefined, { assert: 'ignore-optionality' }),
    ).toBe(undefined);
  });

  it('should warn about null types', async () => {
    await expect(string().strict().validate(null)).rejects.toThrowError(
      /this cannot be null/,
    );
  });

  it('should validateAt', async () => {
    const schema = object({
      foo: array().of(
        object({
          loose: bool(),
          bar: string().when('loose', {
            is: true,
            otherwise: (s) => s.strict(),
          }),
        }),
      ),
    });
    const value = {
      foo: [{ bar: 1 }, { bar: 1, loose: true }],
    };

    await expect(schema.validateAt('foo[1].bar', value)).resolves.toBeDefined();

    await expect(schema.validateAt('foo[0].bar', value)).rejects.toThrowError(
      /bar must be a `string` type/,
    );
  });

  // xit('should castAt', async () => {
  //   const schema = object({
  //     foo: array().of(
  //       object({
  //         loose: bool().default(true),
  //         bar: string(),
  //       }),
  //     ),
  //   });
  //   const value = {
  //     foo: [{ bar: 1 }, { bar: 1, loose: true }],
  //   };

  //   schema.castAt('foo[1].bar', value).should.equal('1');

  //   schema.castAt('foo[0].loose', value).should.equal(true);
  // });

  it('should print the original value', async () => {
    await expect(number().validate('john')).rejects.toThrowError(
      /the final value was: `NaN`.+cast from the value `"john"`/,
    );
  });

  it('should allow function messages', async () => {
    await expect(
      string()
        .label('My string')
        .required((d) => `${d.label} is required`)
        .validate(undefined),
    ).rejects.toThrowError(/My string is required/);
  });

  it('should check types', async () => {
    let inst = string().strict().typeError('must be a ${type}!');

    await expect(inst.validate(5)).rejects.toEqual(
      expect.objectContaining({
        type: 'typeError',
        message: 'must be a string!',
        inner: [],
      }),
    );

    await expect(inst.validate(5, { abortEarly: false })).rejects.toEqual(
      expect.objectContaining({
        type: undefined,
        message: 'must be a string!',
        inner: [expect.any(ValidationError)],
      }),
    );
  });

  it('should limit values', async () => {
    let inst = mixed().oneOf([5, 'hello']);

    await expect(inst.isValid(5)).resolves.toBe(true);
    await expect(inst.isValid('hello')).resolves.toBe(true);

    await expect(inst.validate(6)).rejects.toThrowError(
      'this must be one of the following values: 5, hello',
    );
  });

  it('should limit values with a ref', async () => {
    let someValues = [1, 2, 3];
    let context = { someValues };
    let inst = mixed().oneOf([
      ref('$someValues[0]'),
      ref('$someValues[1]'),
      ref('$someValues[2]'),
    ]);
    await expect(inst.validate(1, { context })).resolves.toBe(1);

    await expect(inst.validate(4, { context })).rejects.toEqual(
      expect.objectContaining({
        type: 'oneOf',
        params: expect.objectContaining({ resolved: someValues }),
      }),
    );
  });

  it('should not require field when notRequired was set', async () => {
    let inst = mixed().required();

    await expect(inst.isValid('test')).resolves.toBe(true);
    await expect(inst.isValid(1)).resolves.toBe(true);

    await expect(inst.validate(undefined)).rejects.toThrowError(
      'this is a required field',
    );

    const next = inst.notRequired();

    await expect(next.isValid(undefined)).resolves.toBe(true);
  });

  // @ts-ignore
  global.YUP_USE_SYNC &&
    describe('synchronous methods', () => {
      it('should validate synchronously', async () => {
        let schema = number();

        expect(schema.isValidSync('john')).toBe(false);

        expect(() => schema.validateSync('john')).toThrowError(
          /the final value was: `NaN`.+cast from the value `"john"`/,
        );
      });

      it('should isValid synchronously', async () => {
        let schema = number();

        expect(schema.isValidSync('john')).toBe(false);
      });

      it('should throw on async test', async () => {
        let schema = mixed().test('test', 'foo', () => Promise.resolve(true));

        await expect(
          ensureSync(() => schema.validate('john')),
        ).rejects.toThrowError(/Validation test of type: "test"/);
      });
    });

  describe('oneOf', () => {
    let inst = mixed().oneOf(['hello']);

    validateAll(inst, {
      valid: [undefined, 'hello', [null, inst.nullable()]],
      invalid: [
        'YOLO',
        [undefined, inst.required(), 'required'],
        // [null, inst.nullable()],
        [null, inst.nullable().required(), 'required'],
      ],
    });

    it('should work with refs', async () => {
      let inst = object({
        foo: string(),
        bar: string().oneOf([ref('foo'), 'b']),
      });

      await expect(
        inst.validate({ foo: 'a', bar: 'a' }),
      ).resolves.toBeDefined();

      await expect(
        inst.validate({ foo: 'foo', bar: 'bar' }),
      ).rejects.toThrowError();
    });
  });

  describe('should exclude values', () => {
    let inst = mixed().nullable().notOneOf([5, 'hello']);

    validateAll(inst, {
      valid: [6, 'hfhfh', [5, inst.oneOf([5]), '`oneOf` called after'], null],
      invalid: [5, [null, inst.required(), 'required schema']],
    });

    it('should throw the correct error', async () => {
      await expect(inst.validate(5)).rejects.toThrowError(
        'this must not be one of the following values: 5, hello',
      );
    });
  });

  it('should run subset of validations first', async () => {
    let called = false;
    let inst = string()
      .strict()
      .test('test', 'boom', () => (called = true));

    await expect(inst.validate(25)).rejects.toThrowError();

    expect(called).toBe(false);
  });

  it('should respect strict', () => {
    let inst = string().equals(['hello', '5']);

    return Promise.all([
      expect(inst.isValid(5)).resolves.toBe(true),
      expect(inst.strict().isValid(5)).resolves.toBe(false),
    ]);
  });

  it('should respect abortEarly', () => {
    let inst = string().trim().min(10);

    return Promise.all([
      expect(inst.strict().validate(' hi ')).rejects.toThrowError(
        /must be a trimmed string/,
      ),

      expect(
        inst.strict().validate(' hi ', { abortEarly: false }),
      ).rejects.toThrowError(/2 errors/),
    ]);
  });

  it('should respect disableStackTrace', () => {
    // let inst = string().trim();
    // return Promise.all([
    //   expect(inst.strict().validate(' hi ')).rejects.toHaveProperty('stack'),
    //   expect(
    //     inst.strict().validate(' hi ', { disableStackTrace: true }),
    //   ).not.toHaveProperty('stack'),
    // ]);
  });

  it('should overload test()', () => {
    let inst = mixed().test('test', noop);

    expect(inst.tests).toHaveLength(1);
    expect(inst.tests[0]!.OPTIONS!.test).toBe(noop);
    expect(inst.tests[0]!.OPTIONS!.message).toBe('${path} is invalid');
  });

  it('should fallback to default message', async () => {
    let inst = mixed().test(() => false);

    await expect(inst.validate('foo')).rejects.toThrowError('this is invalid');
  });

  it('should allow non string messages', async () => {
    let message = { key: 'foo' };
    let inst = mixed().test('test', message, () => false);

    expect(inst.tests).toHaveLength(1);
    expect(inst.tests[0]!.OPTIONS!.message).toBe(message);

    let err = await inst.validate('foo').catch((err) => err);
    expect(err.message).toEqual(message);
  });

  it('should dedupe tests with the same test function', () => {
    let inst = mixed().test('test', ' ', noop).test('test', 'asdasd', noop);

    expect(inst.tests).toHaveLength(1);
    expect(inst.tests[0]!.OPTIONS!.message).toBe('asdasd');
  });

  it('should not dedupe tests with the same test function and different type', () => {
    let inst = mixed().test('test', ' ', noop).test('test-two', 'asdasd', noop);

    expect(inst.tests).toHaveLength(2);
  });

  it('should respect exclusive validation', () => {
    let inst = mixed().test({
      message: 'invalid',
      exclusive: true,
      name: 'test',
      test: () => {},
    });

    //.test({ message: 'also invalid', name: 'test', test: () => {} });

    expect(inst.tests).toHaveLength(1);

    inst = mixed()
      .test({ message: 'invalid', name: 'test', test: () => {} })
      .test({ message: 'also invalid', name: 'test', test: () => {} });

    expect(inst.tests).toHaveLength(2);
  });

  it('should non-exclusive tests should stack', () => {
    let inst = mixed()
      .test({ name: 'test', message: ' ', test: () => {} })
      .test({ name: 'test', message: ' ', test: () => {} });

    expect(inst.tests).toHaveLength(2);
  });

  it('should replace existing tests, with exclusive test ', () => {
    let inst = mixed()
      .test({ name: 'test', message: ' ', test: noop })
      .test({ name: 'test', exclusive: true, message: ' ', test: noop });

    expect(inst.tests).toHaveLength(1);
  });

  it('should replace existing exclusive tests, with non-exclusive', () => {
    let inst = mixed()
      .test({ name: 'test', exclusive: true, message: ' ', test: () => {} })
      .test({ name: 'test', message: ' ', test: () => {} })
      .test({ name: 'test', message: ' ', test: () => {} });

    expect(inst.tests).toHaveLength(2);
  });

  it('exclusive tests should throw without a name', () => {
    expect(() => {
      mixed().test({ message: 'invalid', exclusive: true, test: noop });
    }).toThrowError();
  });

  it('exclusive tests should replace previous ones', async () => {
    let inst = mixed().test({
      message: 'invalid',
      exclusive: true,
      name: 'max',
      test: (v) => v! < 5,
    });

    expect(await inst.isValid(8)).toBe(false);

    expect(
      await inst
        .test({
          message: 'invalid',
          exclusive: true,
          name: 'max',
          test: (v) => v! < 10,
        })
        .isValid(8),
    ).toBe(true);
  });

  it('tests should be called with the correct `this`', async () => {
    let called = false;
    let inst = object({
      other: mixed(),
      test: mixed().test({
        message: 'invalid',
        exclusive: true,
        name: 'max',
        test() {
          expect(this.path).toBe('test');
          expect(this.parent).toEqual({ other: 5, test: 'hi' });
          expect(this.options.context).toEqual({ user: 'jason' });
          called = true;
          return true;
        },
      }),
    });

    await inst.validate(
      { other: 5, test: 'hi' },
      { context: { user: 'jason' } },
    );

    expect(called).toBe(true);
  });

  it('tests should be able to access nested parent', async () => {
    let finalFrom: any, finalOptions: any;
    let testFixture = {
      firstField: 'test',
      second: [
        {
          thirdField: 'test3',
        },
        {
          thirdField: 'test4',
        },
      ],
    };

    let third = object({
      thirdField: mixed().test({
        test() {
          finalFrom = this.from!;
          finalOptions = this.options;
          return true;
        },
      }),
    });

    let second = array().of(third);

    let first = object({
      firstField: mixed(),
      second,
    });

    await first.validate(testFixture);

    expect(finalFrom[0].value).toEqual(testFixture.second[finalOptions.index]);
    expect(finalFrom[0].schema).toBe(third);
    expect(finalFrom[1].value).toBe(testFixture);
    expect(finalFrom[1].schema).toBe(first);
  });

  it('tests can return an error', () => {
    let inst = mixed().test({
      message: 'invalid ${path}',
      name: 'max',
      test() {
        return this.createError({ path: 'my.path' });
      },
    });

    return expect(inst.validate('')).rejects.toEqual(
      expect.objectContaining({
        path: 'my.path',
        errors: ['invalid my.path'],
      }),
    );
  });

  it('should use returned error path and message', () => {
    let inst = mixed().test({
      message: 'invalid ${path}',
      name: 'max',
      test: function () {
        return this.createError({ message: '${path} nope!', path: 'my.path' });
      },
    });

    return expect(inst.validate({ other: 5, test: 'hi' })).rejects.toEqual(
      expect.objectContaining({
        path: 'my.path',
        errors: ['my.path nope!'],
      }),
    );
  });

  it('should allow custom validation', async () => {
    let inst = string().test('name', 'test a', (val) => val === 'jim');

    return expect(inst.validate('joe')).rejects.toThrowError('test a');
  });

  // @ts-ignore
  !global.YUP_USE_SYNC &&
    it('should fail when the test function returns a rejected Promise', async () => {
      let inst = string().test(() => {
        return Promise.reject(new Error('oops an error occurred'));
      });

      return expect(inst.validate('joe')).rejects.toThrowError(
        'oops an error occurred',
      );
    });

  describe('withMutation', () => {
    it('should pass the same instance to a provided function', () => {
      let inst = mixed();
      let func = jest.fn();

      inst.withMutation(func);

      expect(func).toHaveBeenCalledWith(inst);
    });

    it('should temporarily make mutable', () => {
      let inst = mixed();

      expect(inst.tests).toHaveLength(0);

      inst.withMutation((inst) => {
        inst.test('a', () => true);
      });

      expect(inst.tests).toHaveLength(1);
    });

    it('should return immutability', () => {
      let inst = mixed();
      inst.withMutation(() => {});

      expect(inst.tests).toHaveLength(0);

      inst.test('a', () => true);

      expect(inst.tests).toHaveLength(0);
    });

    it('should work with nesting', () => {
      let inst = mixed();

      expect(inst.tests).toHaveLength(0);

      inst.withMutation((inst) => {
        inst.withMutation((inst) => {
          inst.test('a', () => true);
        });
        inst.test('b', () => true);
      });

      expect(inst.tests).toHaveLength(2);
    });
  });

  describe('concat', () => {
    let next: ISchema<any>;
    let inst = object({
      str: string().required(),
      obj: object({
        str: string(),
      }),
    });

    beforeEach(() => {
      next = inst.concat(
        object({
          str: string().required().trim(),
          str2: string().required(),
          obj: object({
            str: string().required(),
          }),
        }),
      );
    });

    it('should have the correct number of tests', () => {
      expect((reach(next, 'str') as Schema).tests).toHaveLength(2);
    });

    it('should have the tests in the correct order', () => {
      expect((reach(next, 'str') as Schema).tests[0].OPTIONS?.name).toBe(
        'required',
      );
    });

    it('should validate correctly', async () => {
      await expect(
        inst.isValid({ str: 'hi', str2: 'hi', obj: {} }),
      ).resolves.toBe(true);

      await expect(
        next.validate({ str: ' hi  ', str2: 'hi', obj: { str: 'hi' } }),
      ).resolves.toEqual({
        str: 'hi',
        str2: 'hi',
        obj: { str: 'hi' },
      });
    });

    it('should throw the correct validation errors', async () => {
      await expect(
        next.validate({ str: 'hi', str2: 'hi', obj: {} }),
      ).rejects.toThrowError('obj.str is a required field');

      await expect(
        next.validate({ str2: 'hi', obj: { str: 'hi' } }),
      ).rejects.toThrowError('str is a required field');
    });
  });

  it('concat should carry over transforms', async () => {
    let inst = string().trim();

    expect(inst.concat(string().min(4)).cast(' hello  ')).toBe('hello');

    await expect(inst.concat(string().min(4)).isValid(' he  ')).resolves.toBe(
      false,
    );
  });

  it('concat should fail on different types', function () {
    let inst = string().default('hi');

    expect(function () {
      // @ts-expect-error invalid combo
      inst.concat(object());
    }).toThrowError(TypeError);
  });

  it('concat should not overwrite label and meta with undefined', function () {
    const testLabel = 'Test Label';
    const testMeta = {
      testField: 'test field',
    };
    let baseSchema = mixed().label(testLabel).meta(testMeta);
    const otherSchema = mixed();

    baseSchema = baseSchema.concat(otherSchema);
    expect(baseSchema.spec.label).toBe(testLabel);
    expect(baseSchema.spec.meta.testField).toBe(testMeta.testField);
  });

  it('concat should allow mixed and other type', function () {
    let inst = mixed().default('hi');

    expect(function () {
      expect(inst.concat(string()).type).toBe('string');
    }).not.toThrowError(TypeError);
  });

  it('concat should validate with mixed and other type', async function () {
    let inst = mixed().concat(number());

    await expect(inst.validate([])).rejects.toThrowError(
      /must be a `number` type/,
    );
  });

  it('concat should maintain undefined defaults', function () {
    let inst = string().default('hi');

    expect(
      inst.concat(string().default(undefined)).getDefault(),
    ).toBeUndefined();
  });

  it('concat should preserve oneOf', async function () {
    let inst = string().oneOf(['a']).concat(string().default('hi'));

    await expect(inst.isValid('a')).resolves.toBe(true);
  });

  it('concat should override presence', async function () {
    let inst = string().required().concat(string().nullable());

    await expect(inst.isValid(undefined)).resolves.toBe(true);
    await expect(inst.isValid(null)).resolves.toBe(true);
  });

  it('gives whitelist precedence to second in concat', async function () {
    let inst = string()
      .oneOf(['a', 'b', 'c'])
      .concat(string().notOneOf(['b']));

    await expect(inst.isValid('a')).resolves.toBe(true);
    await expect(inst.isValid('b')).resolves.toBe(false);
    await expect(inst.isValid('c')).resolves.toBe(true);
  });

  it('gives blacklist precedence to second in concat', async function () {
    let inst = string()
      .notOneOf(['a', 'b', 'c'])
      .concat(string().oneOf(['b', 'c']));

    await expect(inst.isValid('a')).resolves.toBe(false);
    await expect(inst.isValid('b')).resolves.toBe(true);
    await expect(inst.isValid('c')).resolves.toBe(true);
  });

  it('concats whitelist with refs', async function () {
    let inst = object({
      x: string().required(),
      y: string()
        .oneOf([ref('$x'), 'b', 'c'])
        .concat(string().notOneOf(['c', ref('$x')])),
    });

    await expect(inst.isValid({ x: 'a', y: 'a' })).resolves.toBe(false);
    await expect(inst.isValid({ x: 'a', y: 'b' })).resolves.toBe(true);
    await expect(inst.isValid({ x: 'a', y: 'c' })).resolves.toBe(false);
  });

  it('defaults should be validated but not transformed', function () {
    let inst = string().trim().default('  hi  ');

    return expect(inst.validate(undefined)).rejects.toThrowError(
      'this must be a trimmed string',
    );
  });

  it('should handle conditionals', async function () {
    let inst = mixed().when('prop', {
      is: 5,
      then: (s) => s.required('from parent'),
    });

    await expect(
      inst.validate(undefined, { parent: { prop: 5 } } as any),
    ).rejects.toThrowError();
    await expect(
      inst.validate(undefined, { parent: { prop: 1 } } as any),
    ).resolves.toBeUndefined();
    await expect(
      inst.validate('hello', { parent: { prop: 5 } } as any),
    ).resolves.toBeDefined();

    const strInst = string().when('prop', {
      is: 5,
      then: (s) => s.required(),
      otherwise: (s) => s.min(4),
    });

    await expect(
      strInst.validate(undefined, { parent: { prop: 5 } } as any),
    ).rejects.toThrowError();
    await expect(
      strInst.validate('hello', { parent: { prop: 1 } } as any),
    ).resolves.toBeDefined();
    await expect(
      strInst.validate('hel', { parent: { prop: 1 } } as any),
    ).rejects.toThrowError();
  });

  it('should handle multiple conditionals', function () {
    let called = false;
    let inst = mixed().when(['$prop', '$other'], ([prop, other], schema) => {
      expect(other).toBe(true);
      expect(prop).toBe(1);
      called = true;

      return schema;
    });

    inst.cast({}, { context: { prop: 1, other: true } });
    expect(called).toBe(true);

    inst = mixed().when(['$prop', '$other'], {
      is: 5,
      then: (s) => s.required(),
    });

    return expect(
      inst.isValid(undefined, { context: { prop: 5, other: 5 } }),
    ).resolves.toBe(false);
  });

  it('should require context when needed', async function () {
    let inst = mixed().when('$prop', {
      is: 5,
      then: (s) => s.required('from context'),
    });

    await expect(
      inst.validate(undefined, { context: { prop: 5 } }),
    ).rejects.toThrowError();
    await expect(
      inst.validate(undefined, { context: { prop: 1 } }),
    ).resolves.toBeUndefined();
    await expect(
      inst.validate('hello', { context: { prop: 5 } }),
    ).resolves.toBeDefined();

    const strInst = string().when('$prop', {
      is: (val: any) => val === 5,
      then: (s) => s.required(),
      otherwise: (s) => s.min(4),
    });

    await expect(
      strInst.validate(undefined, { context: { prop: 5 } }),
    ).rejects.toThrowError();
    await expect(
      strInst.validate('hello', { context: { prop: 1 } }),
    ).resolves.toBeDefined();
    await expect(
      strInst.validate('hel', { context: { prop: 1 } }),
    ).rejects.toThrowError();
  });

  it('should not use context refs in object calculations', function () {
    let inst = object({
      prop: string().when('$prop', {
        is: 5,
        then: (s) => s.required('from context'),
      }),
    });

    expect(inst.getDefault()).toEqual({ prop: undefined });
  });

  it('should support self references in conditions', async function () {
    let inst = number().when('.', {
      is: (value: number) => value > 0,
      then: (s) => s.min(5),
    });

    await expect(inst.validate(4)).rejects.toThrowError(/must be greater/);

    await expect(inst.validate(5)).resolves.toBeDefined();

    await expect(inst.validate(-1)).resolves.toBeDefined();
  });

  it('should support conditional single argument as options shortcut', async function () {
    let inst = number().when({
      is: (value: number) => value > 0,
      then: (s) => s.min(5),
    });

    await expect(inst.validate(4)).rejects.toThrowError(/must be greater/);

    await expect(inst.validate(5)).resolves.toBeDefined();

    await expect(inst.validate(-1)).resolves.toBeDefined();
  });

  it('should allow nested conditions and lazies', async function () {
    let inst = string().when('$check', {
      is: (value: any) => typeof value === 'string',
      then: (s) =>
        s.when('$check', {
          is: (value: any) => /hello/.test(value),
          then: () => lazy(() => string().min(6)),
        }),
    });

    await expect(
      inst.validate('pass', { context: { check: false } }),
    ).resolves.toBeDefined();

    await expect(
      inst.validate('pass', { context: { check: 'hello' } }),
    ).rejects.toThrowError(/must be at least/);

    await expect(
      inst.validate('passes', { context: { check: 'hello' } }),
    ).resolves.toBeDefined();
  });

  it('should use label in error message', async function () {
    let label = 'Label';
    let inst = object({
      prop: string().required().label(label),
    });

    await expect(inst.validate({})).rejects.toThrowError(
      `${label} is a required field`,
    );
  });

  it('should add meta() data', () => {
    expect(string().meta({ input: 'foo' }).meta({ foo: 'bar' }).meta()).toEqual(
      {
        input: 'foo',
        foo: 'bar',
      },
    );
  });

  describe('schema.describe()', () => {
    let schema: ObjectSchema<any>;
    beforeEach(() => {
      schema = object({
        lazy: lazy(() => string().nullable()),
        foo: array(number().integer()).required(),
        bar: string()
          .max(2)
          .default(() => 'a')
          .meta({ input: 'foo' })
          .label('str!')
          .oneOf(['a', 'b'])
          .notOneOf([ref('foo')])
          .when('lazy', {
            is: 'entered',
            then: (s) => s.defined(),
          }),
        baz: tuple([string(), number()]),
      }).when(['dummy'], (_, s) => {
        return s.shape({
          when: string(),
        });
      });
    });

    it('should describe', () => {
      expect(schema.describe()).toEqual({
        type: 'object',
        meta: undefined,
        label: undefined,
        default: {
          foo: undefined,
          bar: 'a',
          lazy: undefined,
          baz: undefined,
        },
        nullable: false,
        optional: true,
        tests: [],
        oneOf: [],
        notOneOf: [],
        fields: {
          lazy: {
            type: 'lazy',
            meta: undefined,
            label: undefined,
            default: undefined,
          },
          foo: {
            type: 'array',
            meta: undefined,
            label: undefined,
            default: undefined,
            nullable: false,
            optional: false,
            tests: [],
            oneOf: [],
            notOneOf: [],
            innerType: {
              type: 'number',
              meta: undefined,
              label: undefined,
              default: undefined,
              nullable: false,
              optional: true,
              oneOf: [],
              notOneOf: [],
              tests: [
                {
                  name: 'integer',
                  params: undefined,
                },
              ],
            },
          },
          bar: {
            type: 'string',
            label: 'str!',
            default: 'a',
            tests: [{ name: 'max', params: { max: 2 } }],
            meta: {
              input: 'foo',
            },
            nullable: false,
            optional: true,
            oneOf: ['a', 'b'],
            notOneOf: [
              {
                type: 'ref',
                key: 'foo',
              },
            ],
          },
          baz: {
            type: 'tuple',
            meta: undefined,
            label: undefined,
            default: undefined,
            nullable: false,
            optional: true,
            tests: [],
            oneOf: [],
            notOneOf: [],
            innerType: [
              {
                type: 'string',
                meta: undefined,
                label: undefined,
                default: undefined,
                nullable: false,
                optional: true,
                oneOf: [],
                notOneOf: [],
                tests: [],
              },
              {
                type: 'number',
                meta: undefined,
                label: undefined,
                default: undefined,
                nullable: false,
                optional: true,
                oneOf: [],
                notOneOf: [],
                tests: [],
              },
            ],
          },
        },
      });
    });

    it('should describe with options', () => {
      expect(schema.describe({ value: { lazy: 'entered' } })).toEqual({
        type: 'object',
        meta: undefined,
        label: undefined,
        default: {
          foo: undefined,
          bar: 'a',
          lazy: undefined,
          baz: undefined,
          when: undefined,
        },
        nullable: false,
        optional: true,
        tests: [],
        oneOf: [],
        notOneOf: [],
        fields: {
          lazy: {
            type: 'string',
            meta: undefined,
            label: undefined,
            default: undefined,
            nullable: true,
            optional: true,
            oneOf: [],
            notOneOf: [],
            tests: [],
          },
          foo: {
            type: 'array',
            meta: undefined,
            label: undefined,
            default: undefined,
            nullable: false,
            optional: false,
            tests: [],
            oneOf: [],
            notOneOf: [],
            innerType: {
              type: 'number',
              meta: undefined,
              label: undefined,
              default: undefined,
              nullable: false,
              optional: true,
              oneOf: [],
              notOneOf: [],
              tests: [
                {
                  name: 'integer',
                  params: undefined,
                },
              ],
            },
          },
          bar: {
            type: 'string',
            label: 'str!',
            default: 'a',
            tests: [{ name: 'max', params: { max: 2 } }],
            meta: {
              input: 'foo',
            },
            nullable: false,
            optional: false,
            oneOf: ['a', 'b'],
            notOneOf: [
              {
                type: 'ref',
                key: 'foo',
              },
            ],
          },
          baz: {
            type: 'tuple',
            meta: undefined,
            label: undefined,
            default: undefined,
            nullable: false,
            optional: true,
            tests: [],
            oneOf: [],
            notOneOf: [],
            innerType: [
              {
                type: 'string',
                meta: undefined,
                label: undefined,
                default: undefined,
                nullable: false,
                optional: true,
                oneOf: [],
                notOneOf: [],
                tests: [],
              },
              {
                type: 'number',
                meta: undefined,
                label: undefined,
                default: undefined,
                nullable: false,
                optional: true,
                oneOf: [],
                notOneOf: [],
                tests: [],
              },
            ],
          },
          when: {
            type: 'string',
            meta: undefined,
            label: undefined,
            default: undefined,
            notOneOf: [],
            nullable: false,
            oneOf: [],
            optional: true,
            tests: [],
          },
        },
      });
    });
  });

  describe('defined', () => {
    it('should fail when value is undefined', async () => {
      let inst = object({
        prop: string().defined(),
      });

      await expect(inst.validate({})).rejects.toThrowError(
        'prop must be defined',
      );
    });

    it('should pass when value is null', async () => {
      let inst = object({
        prop: string().nullable().defined(),
      });

      await expect(inst.isValid({ prop: null })).resolves.toBe(true);
    });

    it('should pass when value is not undefined', async () => {
      let inst = object({
        prop: string().defined(),
      });

      await expect(inst.isValid({ prop: 'prop value' })).resolves.toBe(true);
    });
  });

  describe('description options', () => {
    const schema = object({
      name: string(),
      type: bool(),
      fancy: string()
        .label('bad label')
        .when('type', {
          is: true,
          then: (schema) => schema.required().label('good label'),
          otherwise: (schema) => schema.label('default label'),
        }),
    });

    it('should pass options', async () => {
      expect(
        // @ts-ignore
        schema.fields.fancy.describe({ parent: { type: true } }).label,
      ).toBe('good label');
      expect(
        // @ts-ignore
        schema.fields.fancy.describe({ parent: { type: true } }).optional,
      ).toBe(false);

      expect(
        // @ts-ignore
        schema.fields.fancy.describe({ parent: { type: false } }).label,
      ).toEqual('default label');
      expect(
        // @ts-ignore
        schema.fields.fancy.describe({ parent: { type: false } }).optional,
      ).toBe(true);
    });
  });
});
