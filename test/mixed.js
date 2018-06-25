import { array, mixed, string, number, object, ref, reach } from '../src';
let noop = () => {};

function ensureSync(fn) {
  let run = false;
  let resolve = t => {
    if (!run) return t;
    throw new Error('Did not execute synchonously');
  };
  let err = t => {
    if (!run) throw t;
    throw new Error('Did not execute synchonously');
  };

  let result = fn().then(resolve, err);

  run = true;
  return result;
}

global.YUP_USE_SYNC &&
  it('[internal] normal methods should be running in sync Mode', async () => {
    let schema = number();

    await ensureSync(() => Promise.resolve()).should.be.rejected();

    await ensureSync(() => schema.isValid('john')).should.be.become(false);

    let err = await ensureSync(() =>
      schema.validate('john'),
    ).should.be.rejected();

    expect(err.message).to.match(
      /the final value was: `NaN`.+cast from the value `"john"`/,
    );
  });

describe('Mixed Types ', () => {
  it('should be immutable', () => {
    let inst = mixed(),
      next;
    let sub = (inst.sub = mixed());

    inst.should.not.equal((next = inst.required()));

    next.sub.should.equal(sub);
    inst.sub.should.equal(next.sub);

    inst.should.be.an.instanceOf(mixed);
    next.should.be.an.instanceOf(mixed);

    return Promise.all([
      inst
        .isValid()
        .should.eventually()
        .equal(true),
      next.isValid(null),
    ]);
  });

  it('cast should return a default when undefined', () => {
    let inst = mixed().default('hello');

    inst.cast(undefined).should.equal('hello');
  });

  it('getDefault should return the default value', function() {
    let inst = string().default('hi');
    inst.getDefault({}).should.equal('hi');
    inst.getDefault().should.equal('hi');
  });
  it('getDefault should return the default value', function() {
    let inst = string().when('$foo', {
      is: 'greet',
      then: string().default('hi'),
    });
    inst.getDefault({ context: { foo: 'greet' } }).should.equal('hi');
  });

  it('should warn about null types', async () => {
    let error = await string()
      .strict()
      .validate(null)
      .should.be.rejected();

    expect(error.message).to.match(/If "null" is intended/);
  });

  it('should print the original value', async () => {
    let error = await number()
      .validate('john')
      .should.be.rejected();

    expect(error.message).to.match(
      /the final value was: `NaN`.+cast from the value `"john"`/,
    );
  });

  it('should allow function messages', async () => {
    let error = await string()
      .label('My string')
      .required(d => `${d.label} is required`)
      .validate()
      .should.be.rejected();

    expect(error.message).to.match(/My string is required/);
  });

  it('should check types', async () => {
    let inst = string()
      .strict()
      .typeError('must be a ${type}!');

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

    await inst
      .isValid(5)
      .should.eventually()
      .equal(true);
    await inst
      .isValid('hello')
      .should.eventually()
      .equal(true);

    let err = await inst.validate(6).should.be.rejected();

    err.errors[0].should.equal(
      'this must be one of the following values: 5, hello',
    );
  });

  it('should not require field when notRequired was set', async () => {
    let inst = mixed().required();

    await inst
      .isValid('test')
      .should.eventually()
      .equal(true);
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
      inst
        .isValid(5)
        .should.eventually()
        .equal(true),
      inst
        .strict()
        .isValid(5)
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should respect abortEarly', () => {
    let inst = string()
      .trim()
      .min(10);

    return Promise.all([
      inst
        .strict()
        .validate(' hi ')
        .should.be.rejected()
        .then(err => {
          err.errors.length.should.equal(1);
        }),

      inst
        .strict()
        .validate(' hi ', { abortEarly: false })
        .should.be.rejected()
        .then(err => {
          err.errors.length.should.equal(2);
        }),
    ]);
  });

  it('should overload test()', () => {
    let inst = mixed().test('test', '', noop, 'mixed.default');

    inst.tests.length.should.equal(1);
    inst.tests[0].TEST.test.should.equal(noop);
    inst.tests[0].TEST.message.should.equal('');
    inst.tests[0].TEST.localePath.should.equal('mixed.default');
  });

  it('should allow non string messages', async () => {
    let message = { key: 'foo' };
    let inst = mixed().test('test', message, () => false);

    inst.tests.length.should.equal(1);
    inst.tests[0].TEST.message.should.equal(message);

    let error = await inst.validate('foo').should.be.rejected();

    error.message.should.equal(message);
  });

  it('should fallback to mixed.default locale message when not specified', async () => {
    let inst = mixed()
      .test('test', null, () => false)
      .label('field');

    let error = await inst.validate('foo').should.be.rejected();

    error.message.should.equal('field is invalid');
  });

  it('should ignore localePath when message is specified', async () => {
    let inst = mixed().test(
      'test',
      'my custom message',
      () => false,
      'mixed.default',
    );

    let error = await inst.validate('foo').should.be.rejected();

    error.message.should.equal('my custom message');
  });

  it('should dedupe tests with the same test function', () => {
    let inst = mixed()
      .test('test', ' ', noop)
      .test('test', 'asdasd', noop);

    inst.tests.length.should.equal(1);
    inst.tests[0].TEST.message.should.equal('asdasd');
  });

  it('should not dedupe tests with the same test function and different type', () => {
    let inst = mixed()
      .test('test', ' ', noop)
      .test('test-two', 'asdasd', noop);

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
      test: v => v < 5,
    });

    (await inst.isValid(8)).should.equal(false);

    (await inst
      .test({
        message: 'invalid',
        exclusive: true,
        name: 'max',
        test: v => v < 10,
      })
      .isValid(8)).should.equal(true);
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
      .then(function(e) {
        e.path.should.equal('my.path');
        e.errors[0].should.equal('invalid my.path');
      });
  });

  it('should use returned error path and message', () => {
    let inst = mixed().test({
      message: 'invalid ${path}',
      name: 'max',
      test: function() {
        return this.createError({ message: '${path} nope!', path: 'my.path' });
      },
    });

    return inst
      .validate({ other: 5, test: 'hi' })
      .should.be.rejected()
      .then(function(e) {
        e.path.should.equal('my.path');
        e.errors[0].should.equal('my.path nope!');
      });
  });

  it('should allow custom validation', async () => {
    let inst = string().test('name', 'test a', val => val === 'jim');

    return inst
      .validate('joe')
      .should.be.rejected()
      .then(e => {
        e.errors[0].should.equal('test a');
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
          str: string()
            .required()
            .trim(),
          str2: string().required(),
          obj: object({
            str: string().required(),
          }),
        }),
      );
    });

    it('should have the correct number of tests', () => {
      reach(next, 'str').tests.length.should.equal(3); // presence, alt presence, and trim
    });

    it('should have the tests in the correct order', () => {
      reach(next, 'str').tests[0].TEST_NAME.should.equal('required');
    });

    it('should validate correctly', async () => {
      await inst
        .isValid({ str: 'hi', str2: 'hi', obj: {} })
        .should.become(true);
      (await next
        .validate({ str: ' hi  ', str2: 'hi', obj: { str: 'hi' } })
        .should.be.fulfilled()).should.deep.eql({
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

  it('concat should fail on different types', function() {
    let inst = string().default('hi');

    (function() {
      inst.concat(object());
    }.should.throw(TypeError));
  });

  it('concat should allow mixed and other type', function() {
    let inst = mixed().default('hi');

    (function() {
      inst.concat(string())._type.should.equal('string');
    }.should.not.throw(TypeError));
  });

  it('concat should maintain undefined defaults', function() {
    let inst = string().default('hi');

    expect(inst.concat(string().default(undefined)).default()).to.equal(
      undefined,
    );
  });

  it('defaults should be validated but not transformed', function() {
    let inst = string()
      .trim()
      .default('  hi  ');

    return inst
      .validate(undefined)
      .should.be.rejected()
      .then(function(err) {
        err.message.should.equal('this must be a trimmed string');
      });
  });

  it('should handle conditionals', async function() {
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
      is: function(val) {
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

  it('should handle multiple conditionals', function() {
    let called = false;
    let inst = mixed().when(['prop', 'other'], function(prop, other) {
      other.should.equal(true);
      prop.should.equal(1);
      called = true;
    });

    inst.cast({}, { context: { prop: 1, other: true } });
    called.should.equal(true);

    inst = mixed().when(['prop', 'other'], {
      is: 5,
      then: mixed().required(),
    });

    return inst
      .isValid(undefined, { context: { prop: 5, other: 5 } })
      .should.eventually()
      .equal(false);
  });

  it('should require context when needed', async function() {
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
      is: function(val) {
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

  it('should not use context refs in object calculations', function() {
    let inst = object({
      prop: string().when('$prop', {
        is: 5,
        then: string().required('from context'),
      }),
    });

    inst.default().should.eql({ prop: undefined });
  });

  it('should use label in error message', async function() {
    let label = 'Label';
    let inst = object({
      prop: string()
        .required()
        .label(label),
    });

    await inst
      .validate({})
      .should.be.rejected()
      .then(function(err) {
        err.message.should.equal(`${label} is a required field`);
      });
  });

  it('should add meta() data', () => {
    string()
      .meta({ input: 'foo' })
      .meta({ foo: 'bar' })
      .meta()
      .should.eql({
        input: 'foo',
        foo: 'bar',
      });
  });

  it('should describe', () => {
    const desc = object({
      foos: array(number().integer()).required(),
      foo: string()
        .max(2)
        .meta({ input: 'foo' })
        .label('str!'),
    }).describe();

    desc.should.eql({
      type: 'object',
      meta: undefined,
      label: undefined,
      tests: [],
      fields: {
        foos: {
          type: 'array',
          meta: undefined,
          label: undefined,
          tests: ['required'],
          innerType: {
            type: 'number',
            meta: undefined,
            label: undefined,
            tests: ['integer'],
          },
        },
        foo: {
          type: 'string',
          label: 'str!',
          tests: ['max'],
          meta: {
            input: 'foo',
          },
        },
      },
    });
  });
});
