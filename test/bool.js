import bool from '../src/boolean';

describe('Boolean types', () => {
  it('should CAST correctly', () => {
    const inst = bool();

    inst.cast('true').should.equal(true);
    inst.cast('True').should.equal(true);
    inst.cast('false').should.equal(false);
    inst.cast('False').should.equal(false);
    inst.cast(1).should.equal(true);
    inst.cast(0).should.equal(false);

    TestHelpers
      .castAndShouldFail(inst, 'foo');

    TestHelpers
      .castAndShouldFail(inst, 'bar1');
  });

  it('should handle DEFAULT', () => {
    const inst = bool();

    expect(inst.default()).to.equal(undefined);
    inst.default(true).required().default().should.equal(true);
  });

  it('should type check', () => {
    const inst = bool();

    inst.isType(1).should.equal(false);
    inst.isType(false).should.equal(true);
    inst.isType('true').should.equal(false);
    inst.isType(NaN).should.equal(false);
    inst.isType(Number('foooo')).should.equal(false);

    inst.isType(34545).should.equal(false);
    inst.isType(Boolean(false)).should.equal(true);

    expect(inst.isType(null)).to.equal(false);

    inst.nullable().isType(null).should.equal(true);
  });

  it('should VALIDATE correctly', () => {
    const inst = bool().required();

    return Promise.all([
      bool().isValid('1').should.eventually().equal(true),

      bool().strict().isValid(null).should.eventually().equal(false),

      bool().nullable().isValid(null).should.eventually().equal(true),

      inst.validate().should.be.rejected().then((err) => {
        err.errors.length.should.equal(1);
        err.errors[0].should.contain('required');
      }),
    ]);
  });
});
