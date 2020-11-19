import {
  array,
  bool,
  lazy,
  mixed,
  number,
  object,
  reach,
  ref,
  string,
  ValidationError,
  MixedSchema,
} from '../src';
import { ensureSync } from './helpers';

let noop = () => {};

global.YUP_USE_SYNC &&
  it('[internal] normal methods should be running in sync Mode', async () => {
    let schema = number();

    // test negative ensure case
    await ensureSync(() => Promise.resolve()).should.be.rejectedWith(
      Error,
      'Did not execute synchronously',
    );
    // test positive case
    await ensureSync(() => schema.isValid(1)).should.be.become(true);

    // ensureit fails with the correct message in sync mode
    let err = await ensureSync(() =>
      schema.validate('john'),
    ).should.be.rejected();

    expect(err.message).to.match(
      /the final value was: `NaN`.+cast from the value `"john"`/,
    );
  });

describe('Mixed Types ', () => {
  xit('should be immutable', () => {
    let inst = mixed(),
      next;
    let sub = (inst.sub = mixed());

    inst.should.not.equal((next = inst.required()));

    next.sub.should.equal(sub);
    inst.sub.should.equal(next.sub);

    inst.should.be.an.instanceOf(MixedSchema);
    next.should.be.an.instanceOf(MixedSchema);

    return Promise.all([
      inst.isValid().should.eventually().equal(true),
      next.isValid(null),
    ]);
  });

  it('cast should return a default when undefined', () => {
    let inst = mixed().default('hello');

    inst.cast(undefined).should.equal('hello');
  });

  it('getDefault should return the default value', function () {
    let inst = string().default('hi');
    inst.getDefault({}).should.equal('hi');
    inst.getDefault().should.equal('hi');
  });

  it('getDefault should return the default value using context', function () {
    let inst = string().when('$foo', {
      is: 'greet',
      then: string().default('hi'),
    });
    inst.getDefault({ context: { foo: 'greet' } }).should.equal('hi');
  });

  it('should warn about null types', async () => {
    let error = await string().strict().validate(null).should.be.rejected();

    expect(error.message).to.match(/If "null" is intended/);
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

    await schema.validateAt('foo[1].bar', value).should.be.fulfilled();

    const err = await schema
      .validateAt('foo[0].bar', value)
      .should.be.rejected();

    expect(err.message).to.match(/bar must be a `string` type/);
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
    let error = await number().validate('john').should.be.rejected();

    expect(error.message).to.match(
      /the final value was: `NaN`.+cast from the value `"john"`/,
    );
  });

  it('should allow function messages', async () => {
    let error = await string()
      .label('My string')
      .required((d) => `${d.label} is required`)
      .validate()
      .should.be.rejected();

    expect(error.message).to.match(/My string is required/);
  });

  it('should check types', async () => {
    let inst = string().strict().typeError('must be a ${type}!');

    let error = await inst.validate(5).should.be.rejected();

    error.type.should.equal('typeError');
    error.message.should.equal('must be a string!');
    error.inner.length.should.equal(0);

    error = await inst.validate(5, { abortEarly: false }).should.be.rejected();

    expect(error.type).to.not.exist();
    error.message.should.equal('must be a string!');
    error.inner.length.should.equal(1);
  });

  it('should limit values', async () => {
    let inst = mixed().oneOf([5, 'hello']);

    await inst.isValid(5).should.eventually().equal(true);
    await inst.isValid('hello').should.eventually().equal(true);

    let err = await inst.validate(6).should.be.rejected();

    err.errors[0].should.equal(
      'this must be one of the following values: 5, hello',
    );
  });

  it('should not require field when notRequired was set', async () => {
    let inst = mixed().required();

    await inst.isValid('test').should.eventually().equal(true);
    await inst.isValid(1).should.eventually.equal(true);

    let err = await inst.validate().should.be.rejected();

    err.errors[0].should.equal('this is a required field');

    inst = inst.notRequired();

    await inst.isValid().should.eventually.equal(true);
  });

  global.YUP_USE_SYNC &&
    describe('synchronous methods', () => {
      it('should validate synchronously', async () => {
        let schema = number();

        schema.isValidSync('john').should.equal(false);

        expect(() => schema.validateSync('john')).to.throw(
          /the final value was: `NaN`.+cast from the value `"john"`/,
        );
      });

      it('should isValid synchronously', async () => {
        let schema = number();

        schema.isValidSync('john').should.equal(false);
      });

      it('should throw on async test', async () => {
        let schema = mixed().test('test', 'foo', () => Promise.resolve());

        let err = await ensureSync(() =>
          schema.validate('john'),
        ).should.be.rejected();

        expect(err.message).to.match(/Validation test of type: "test"/);
      });
    });

  describe('oneOf', () => {
    let inst = mixed().oneOf(['hello']);

    TestHelpers.validateAll(inst, {
      valid: [undefined, 'hello'],
      invalid: [
        'YOLO',
        [undefined, inst.required(), 'required'],
        [null, inst.nullable()],
        [null, inst.nullable().required(), 'required'],
      ],
    });

    it('should work with refs', async () => {
      let inst = object({
        foo: string(),
        bar: string().oneOf([ref('foo'), 'b']),
      });

      await inst.validate({ foo: 'a', bar: 'a' }).should.be.fulfilled();

      await inst.validate({ foo: 'foo', bar: 'bar' }).should.be.rejected();
    });
  });

  describe('should exclude values', () => {
    let inst = mixed().notOneOf([5, 'hello']);

    TestHelpers.validateAll(inst, {
      valid: [6, 'hfhfh', [5, inst.oneOf([5]), '`oneOf` called after'], null],
      invalid: [5, [null, inst.required(), 'required schema']],
    });

    it('should throw the correct error', async () => {
      let err = await inst.validate(5).should.be.rejected();

      err.errors[0].should.equal(
        'this must not be one of the following values: 5, hello',
      );
    });
  });

  it('should run subset of validations first', () => {
    let called = false;
    let inst = string()
      .strict()
      .test('test', 'boom', () => (called = true));

    return inst
      .validate(25)
      .should.be.rejected()
      .then(() => {
        called.should.equal(false);
      });
  });

  it('should respect strict', () => {
    let inst = string().equals(['hello', '5']);

    return Promise.all([
      inst.isValid(5).should.eventually().equal(true),
      inst.strict().isValid(5).should.eventually().equal(false),
    ]);
  });

  it('should respect abortEarly', () => {
    let inst = string().trim().min(10);

    return Promise.all([
      inst
        .strict()
        .validate(' hi ')
        .should.be.rejected()
        .then((err) => {
          err.errors.length.should.equal(1);
        }),

      inst
        .strict()
        .validate(' hi ', { abortEarly: false })
        .should.be.rejected()
        .then((err) => {
          err.errors.length.should.equal(2);
        }),
    ]);
  });

  it('should overload test()', () => {
    let inst = mixed().test('test', noop);

    inst.tests.length.should.equal(1);
    inst.tests[0].OPTIONS.test.should.equal(noop);
    inst.tests[0].OPTIONS.message.should.equal('${path} is invalid');
  });

  it('should fallback to default message', async () => {
    let inst = mixed().test(() => false);

    await inst
      .validate('foo')
      .should.be.rejectedWith(ValidationError, 'this is invalid');
  });

  it('should allow non string messages', async () => {
    let message = { key: 'foo' };
    let inst = mixed().test('test', message, () => false);

    inst.tests.length.should.equal(1);
    inst.tests[0].OPTIONS.message.should.equal(message);

    let error = await inst.validate('foo').should.be.rejected();

    error.message.should.equal(message);
  });

  it('should dedupe tests with the same test function', () => {
    let inst = mixed().test('test', ' ', noop).test('test', 'asdasd', noop);

    inst.tests.length.should.equal(1);
    inst.tests[0].OPTIONS.message.should.equal('asdasd');
  });

  it('should not dedupe tests with the same test function and different type', () => {
    let inst = mixed().test('test', ' ', noop).test('test-two', 'asdasd', noop);

    inst.tests.length.should.equal(2);
  });

  it('should respect exclusive validation', () => {
    let inst = mixed()
      .test({
        message: 'invalid',
        exclusive: true,
        name: 'test',
        test: () => {},
      })
      .test({ message: 'also invalid', name: 'test', test: () => {} });

    inst.tests.length.should.equal(1);

    inst = mixed()
      .test({ message: 'invalid', name: 'test', test: () => {} })
      .test({ message: 'also invalid', name: 'test', test: () => {} });

    inst.tests.length.should.equal(2);
  });

  it('should non-exclusive tests should stack', () => {
    let inst = mixed()
      .test({ name: 'test', message: ' ', test: () => {} })
      .test({ name: 'test', message: ' ', test: () => {} });

    inst.tests.length.should.equal(2);
  });

  it('should replace existing tests, with exclusive test ', () => {
    let inst = mixed()
      .test({ name: 'test', message: ' ', test: noop })
      .test({ name: 'test', exclusive: true, message: ' ', test: noop });

    inst.tests.length.should.equal(1);
  });

  it('should replace existing exclusive tests, with non-exclusive', () => {
    let inst = mixed()
      .test({ name: 'test', exclusive: true, message: ' ', test: () => {} })
      .test({ name: 'test', message: ' ', test: () => {} })
      .test({ name: 'test', message: ' ', test: () => {} });

    inst.tests.length.should.equal(2);
  });

  it('exclusive tests should throw without a name', () => {
    (() => {
      mixed().test({ message: 'invalid', exclusive: true, test: noop });
    }).should.throw();
  });

  it('exclusive tests should replace previous ones', async () => {
    let inst = mixed().test({
      message: 'invalid',
      exclusive: true,
      name: 'max',
      test: (v) => v < 5,
    });

    (await inst.isValid(8)).should.equal(false);

    (
      await inst
        .test({
          message: 'invalid',
          exclusive: true,
          name: 'max',
          test: (v) => v < 10,
        })
        .isValid(8)
    ).should.equal(true);
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
          this.path.should.equal('test');
          this.parent.should.eql({ other: 5, test: 'hi' });
          this.options.context.should.eql({ user: 'jason' });
          called = true;
          return true;
        },
      }),
    });

    await inst.validate(
      { other: 5, test: 'hi' },
      { context: { user: 'jason' } },
    );

    called.should.equal(true);
  });

  it('tests should be able to access nested parent', async () => {
    let finalFrom, finalOptions;
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
          finalFrom = this.from;
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
    // console.log(finalFrom);
    finalFrom[0].value.should.eql(testFixture.second[finalOptions.index]);
    finalFrom[0].schema.should.equal(third);
    finalFrom[1].value.should.equal(testFixture);
    finalFrom[1].schema.should.equal(first);
  });

  it('tests can return an error', () => {
    let inst = mixed().test({
      message: 'invalid ${path}',
      name: 'max',
      test() {
        return this.createError({ path: 'my.path' });
      },
    });

    return inst
      .validate('')
      .should.be.rejected()
      .then(function (e) {
        e.path.should.equal('my.path');
        e.errors[0].should.equal('invalid my.path');
      });
  });

  it('should use returned error path and message', () => {
    let inst = mixed().test({
      message: 'invalid ${path}',
      name: 'max',
      test: function () {
        return this.createError({ message: '${path} nope!', path: 'my.path' });
      },
    });

    return inst
      .validate({ other: 5, test: 'hi' })
      .should.be.rejected()
      .then(function (e) {
        e.path.should.equal('my.path');
        e.errors[0].should.equal('my.path nope!');
      });
  });

  it('should allow custom validation', async () => {
    let inst = string().test('name', 'test a', (val) => val === 'jim');

    return inst
      .validate('joe')
      .should.be.rejected()
      .then((e) => {
        e.errors[0].should.equal('test a');
      });
  });

  describe('withMutation', () => {
    it('should pass the same instance to a provided function', () => {
      let inst = mixed();
      let func = sinon.spy();

      inst.withMutation(func);

      func.should.have.been.calledOnceWithExactly(inst);
    });

    it('should temporarily make mutable', () => {
      let inst = mixed();

      let update = () => {
        inst.withMutation((inst) => {
          inst.test('a', () => true);
        });
      };

      update.should.increase(() => inst.tests.length).by(1);
    });

    it('should return immutability', () => {
      let inst = mixed();
      inst.withMutation(() => {});

      let update = () => {
        inst.test('a', () => true);
      };

      update.should.not.increase(() => inst.tests.length);
    });

    it('should work with nesting', () => {
      let inst = mixed();

      let update = () => {
        inst.withMutation((inst) => {
          inst.withMutation((inst) => {
            inst.test('a', () => true);
          });
          inst.test('b', () => true);
        });
      };

      update.should.increase(() => inst.tests.length).by(2);
    });
  });

  describe('concat', () => {
    let next;
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
      reach(next, 'str').tests.length.should.equal(2);
    });

    it('should have the tests in the correct order', () => {
      reach(next, 'str').tests[0].OPTIONS.name.should.equal('required');
    });

    it('should validate correctly', async () => {
      await inst
        .isValid({ str: 'hi', str2: 'hi', obj: {} })
        .should.become(true);
      (
        await next
          .validate({ str: ' hi  ', str2: 'hi', obj: { str: 'hi' } })
          .should.be.fulfilled()
      ).should.deep.eql({
        str: 'hi',
        str2: 'hi',
        obj: { str: 'hi' },
      });
    });

    it('should throw the correct validation errors', async () => {
      let result = await next
        .validate({ str: 'hi', str2: 'hi', obj: {} })
        .should.be.rejected();

      result.message.should.contain('obj.str is a required field');

      result = await next
        .validate({ str2: 'hi', obj: { str: 'hi' } })
        .should.be.rejected();

      result.message.should.contain('str is a required field');
    });
  });

  it('concat should fail on different types', function () {
    let inst = string().default('hi');

    (function () {
      inst.concat(object());
    }.should.throw(TypeError));
  });

  it('concat should allow mixed and other type', function () {
    let inst = mixed().default('hi');

    (function () {
      inst.concat(string())._type.should.equal('string');
    }.should.not.throw(TypeError));
  });

  it('concat should validate with mixed and other type', async function () {
    let inst = mixed().concat(number());

    await inst
      .validate([])
      .should.be.rejected(ValidationError, /should be a `number`/);
  });

  it('concat should maintain undefined defaults', function () {
    let inst = string().default('hi');

    expect(inst.concat(string().default(undefined)).default()).to.equal(
      undefined,
    );
  });

  it('concat should preserve oneOf', async function () {
    let inst = string().oneOf(['a']).concat(string().default('hi'));

    await inst.isValid('a').should.become(true);
  });

  it('concat should maintain explicit nullability', async function () {
    let inst = string().nullable().concat(string().default('hi'));

    await inst.isValid(null).should.become(true);
  });

  it('concat should maintain explicit presence', async function () {
    let inst = string().required().concat(string());

    await inst.isValid(undefined).should.become(false);
  });

  it('gives whitelist precedence to second in concat', async function () {
    let inst = string()
      .oneOf(['a', 'b', 'c'])
      .concat(string().notOneOf(['b']));

    await inst.isValid('a').should.become(true);
    await inst.isValid('b').should.become(false);
    await inst.isValid('c').should.become(true);
  });

  it('gives blacklist precedence to second in concat', async function () {
    let inst = string()
      .notOneOf(['a', 'b', 'c'])
      .concat(string().oneOf(['b', 'c']));

    await inst.isValid('a').should.become(false);
    await inst.isValid('b').should.become(true);
    await inst.isValid('c').should.become(true);
  });

  it('concats whitelist with refs', async function () {
    let inst = object({
      x: string().required(),
      y: string()
        .oneOf([ref('$x'), 'b', 'c'])
        .concat(string().notOneOf(['c', ref('$x')])),
    });

    await inst.isValid({ x: 'a', y: 'a' }).should.become(false);
    await inst.isValid({ x: 'a', y: 'b' }).should.become(true);
    await inst.isValid({ x: 'a', y: 'c' }).should.become(false);
  });

  it('defaults should be validated but not transformed', function () {
    let inst = string().trim().default('  hi  ');

    return inst
      .validate(undefined)
      .should.be.rejected()
      .then(function (err) {
        err.message.should.equal('this must be a trimmed string');
      });
  });

  it('should handle conditionals', async function () {
    let inst = mixed().when('prop', {
      is: 5,
      then: mixed().required('from parent'),
    });

    await inst
      .validate(undefined, { parent: { prop: 5 } })
      .should.be.rejected();
    await inst
      .validate(undefined, { parent: { prop: 1 } })
      .should.be.fulfilled();
    await inst.validate('hello', { parent: { prop: 5 } }).should.be.fulfilled();

    inst = string().when('prop', {
      is: function (val) {
        return val === 5;
      },
      then: string().required(),
      otherwise: string().min(4),
    });

    await inst
      .validate(undefined, { parent: { prop: 5 } })
      .should.be.rejected();
    await inst.validate('hello', { parent: { prop: 1 } }).should.be.fulfilled();
    await inst.validate('hel', { parent: { prop: 1 } }).should.be.rejected();
  });

  it('should handle multiple conditionals', function () {
    let called = false;
    let inst = mixed().when(['$prop', '$other'], function (prop, other) {
      other.should.equal(true);
      prop.should.equal(1);
      called = true;
    });

    inst.cast({}, { context: { prop: 1, other: true } });
    called.should.equal(true);

    inst = mixed().when(['$prop', '$other'], {
      is: 5,
      then: mixed().required(),
    });

    return inst
      .isValid(undefined, { context: { prop: 5, other: 5 } })
      .should.eventually()
      .equal(false);
  });

  it('should require context when needed', async function () {
    let inst = mixed().when('$prop', {
      is: 5,
      then: mixed().required('from context'),
    });

    await inst
      .validate(undefined, { context: { prop: 5 } })
      .should.be.rejected();
    await inst
      .validate(undefined, { context: { prop: 1 } })
      .should.be.fulfilled();
    await inst
      .validate('hello', { context: { prop: 5 } })
      .should.be.fulfilled();

    inst = string().when('$prop', {
      is: function (val) {
        return val === 5;
      },
      then: string().required(),
      otherwise: string().min(4),
    });

    await inst
      .validate(undefined, { context: { prop: 5 } })
      .should.be.rejected();
    await inst
      .validate('hello', { context: { prop: 1 } })
      .should.be.fulfilled();
    await inst.validate('hel', { context: { prop: 1 } }).should.be.rejected();
  });

  it('should not use context refs in object calculations', function () {
    let inst = object({
      prop: string().when('$prop', {
        is: 5,
        then: string().required('from context'),
      }),
    });

    inst.default().should.eql({ prop: undefined });
  });

  it('should support self references in conditions', async function () {
    let inst = number().when('.', {
      is: (value) => value > 0,
      then: number().min(5),
    });

    await inst
      .validate(4)
      .should.be.rejectedWith(ValidationError, /must be greater/);

    await inst.validate(5).should.be.fulfilled();

    await inst.validate(-1).should.be.fulfilled();
  });

  it('should support conditional single argument as options shortcut', async function () {
    let inst = number().when({
      is: (value) => value > 0,
      then: number().min(5),
    });

    await inst
      .validate(4)
      .should.be.rejectedWith(ValidationError, /must be greater/);

    await inst.validate(5).should.be.fulfilled();

    await inst.validate(-1).should.be.fulfilled();
  });

  it('should allow nested conditions and lazies', async function () {
    let inst = string().when('$check', {
      is: (value) => typeof value === 'string',
      then: string().when('$check', {
        is: (value) => /hello/.test(value),
        then: lazy(() => string().min(6)),
      }),
    });

    await inst
      .validate('pass', { context: { check: false } })
      .should.be.fulfilled();

    await inst
      .validate('pass', { context: { check: 'hello' } })
      .should.be.rejectedWith(ValidationError, /must be at least/);

    await inst
      .validate('passes', { context: { check: 'hello' } })
      .should.be.fulfilled();
  });

  it('should use label in error message', async function () {
    let label = 'Label';
    let inst = object({
      prop: string().required().label(label),
    });

    await inst
      .validate({})
      .should.be.rejected()
      .then(function (err) {
        err.message.should.equal(`${label} is a required field`);
      });
  });

  it('should add meta() data', () => {
    string().meta({ input: 'foo' }).meta({ foo: 'bar' }).meta().should.eql({
      input: 'foo',
      foo: 'bar',
    });
  });

  it('should describe', () => {
    const desc = object({
      foo: array(number().integer()).required(),
      bar: string()
        .max(2)
        .meta({ input: 'foo' })
        .label('str!')
        .oneOf(['a', 'b'])
        .notOneOf([ref('foo')]),
    }).describe();

    desc.should.eql({
      type: 'object',
      meta: undefined,
      label: undefined,
      tests: [],
      oneOf: [],
      notOneOf: [],
      fields: {
        foo: {
          type: 'array',
          meta: undefined,
          label: undefined,
          tests: [
            {
              name: 'required',
              params: undefined,
            },
          ],

          oneOf: [],
          notOneOf: [],
          innerType: {
            type: 'number',
            meta: undefined,
            label: undefined,
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
          tests: [{ name: 'max', params: { max: 2 } }],
          meta: {
            input: 'foo',
          },
          oneOf: ['a', 'b'],
          notOneOf: [
            {
              type: 'ref',
              key: 'foo',
            },
          ],
        },
      },
    });
  });

  describe('defined', () => {
    it('should fail when value is undefined', async () => {
      let inst = object({
        prop: string().defined(),
      });

      await inst
        .validate({})
        .should.be.rejected()
        .then(function (err) {
          err.message.should.equal('prop must be defined');
        });
    });

    it('should pass when value is null', async () => {
      let inst = object({
        prop: string().nullable().defined(),
      });

      await inst.isValid({ prop: null }).should.eventually().equal(true);
    });

    it('should pass when value is not undefined', async () => {
      let inst = object({
        prop: string().defined(),
      });

      await inst
        .isValid({ prop: 'prop value' })
        .should.eventually()
        .equal(true);
    });
  });
});
