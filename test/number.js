import * as TestHelpers from './helpers';

import number from '../src/number';

describe('Number types', () => {
  it('is newable', () => {
    const schema = number();
    schema.integer().required();
  });

  it('is extensible', () => {
    class MyNumber extends number {
      foo() {
        return this;
      }
    }

    new MyNumber().foo().integer().required();
  });

  describe('casting', () => {
    const schema = number();

    TestHelpers.castAll(schema, {
      valid: [
        ['5', 5],
        [3, 3],
        // [new Number(5), 5],
        [' 5.656 ', 5.656],
      ],
      invalid: [
        '',
        false,
        true,
        new Date(),
        Number('foo'),
      ],
    });

    it('should round', () => {
      schema.round('floor').cast(45.99999).should.equal(45);
      schema.round('ceIl').cast(45.1111).should.equal(46);
      schema.round().cast(45.444444).should.equal(45);

      expect(
        schema.nullable()
          .integer()
          .round()
          .cast(null),
      ).to.equal(null);

      (function test() { schema.round('fasf'); }).should.throw(TypeError);
    });

    it('should truncate', () => {
      schema.truncate().cast(45.55).should.equal(45);
    });

    it('should return NaN for failed casts', () => {
      expect(
        number().cast('asfasf', { assert: false })).to.eql(NaN);

      expect(
        number().cast(null, { assert: false })).to.eql(NaN);
    });
  });

  it('should handle DEFAULT', () => {
    const inst = number().default(0);

    inst.default().should.equal(0);
    inst.default(5).required().default().should.equal(5);
  });

  it('should type check', () => {
    const inst = number();

    inst.isType(5).should.equal(true);
    inst.isType(Number(5)).should.equal(true);
    inst.isType(Number('foo')).should.equal(false);
    inst.isType(false).should.equal(false);
    inst.isType(null).should.equal(false);
    inst.isType(NaN).should.equal(false);
    inst.nullable().isType(null).should.equal(true);
  });

  it('should VALIDATE correctly', () => {
    const inst = number().required().min(4);

    return Promise.all([
      number().isValid(null).should.eventually().equal(false),
      number().nullable().isValid(null).should.eventually().equal(true),

      inst.isValid(5).should.eventually().equal(true),
      inst.isValid(2).should.eventually().equal(false),

      inst.validate().should.be.rejected().then((err) => {
        err.errors.length.should.equal(1);
        err.errors[0].should.contain('required');
      }),
    ]);
  });

  describe('min', () => {
    const schema = number().min(5);

    TestHelpers.validateAll(schema, {
      valid: [
        7,
        35738787838,
        [null, schema.nullable()],
      ],
      invalid: [
        2,
        null,
        [14, schema.min(10).min(15)],
      ],
    });
  });

  describe('max', () => {
    const schema = number().max(5);

    TestHelpers.validateAll(schema, {
      valid: [
        4,
        -5222,
        [null, schema.nullable()],
      ],
      invalid: [
        10,
        null,
        [16, schema.max(20).max(15)],
      ],
    });
  });

  describe('integer', () => {
    TestHelpers.validateAll(
      number().integer(),
      {
        valid: [
          4,
          -5222,
        ],
        invalid: [
          10.53,
          0.1 * 0.2,
          -34512535.626,
          3.12312e+51,
          new Date(),
        ],
      },
    );
  });
  it('should check integer', () => {
    const v = number().positive();

    return Promise.all([
      v.isValid(7).should.eventually().equal(true),

      v.isValid(0).should.eventually().equal(true),

      v.validate(-4).should.be.rejected().then(null, (err) => {
        err.errors[0].should.contain('this must be a positive number');
      }),
    ]);
  });

  it('should check POSITIVE correctly', () => {
    const v = number().positive();

    return Promise.all([
      v.isValid(7).should.eventually().equal(true),

      v.isValid(0).should.eventually().equal(true),

      v.validate(-4).should.be.rejected().then(null, (err) => {
        err.errors[0].should.contain('this must be a positive number');
      }),
    ]);
  });

  it('should check NEGATIVE correctly', () => {
    const v = number().negative();

    return Promise.all([
      v.isValid(-4).should.eventually().equal(true),

      v.isValid(0).should.eventually().equal(true),

      v.validate(10).should.be.rejected().then(null, (err) => {
        err.errors[0].should.contain('this must be a negative number');
      }),
    ]);
  });
});
