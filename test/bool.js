import { bool } from '../src';

describe('Boolean types', () => {
  it('should CAST correctly', () => {
    let inst = bool();

    inst.cast('true').should.equal(true);
    inst.cast('True').should.equal(true);
    inst.cast('false').should.equal(false);
    inst.cast('False').should.equal(false);
    inst.cast(1).should.equal(true);
    inst.cast(0).should.equal(false);

    TestHelpers.castAndShouldFail(inst, 'foo');

    TestHelpers.castAndShouldFail(inst, 'bar1');
  });

  it('should handle DEFAULT', () => {
    let inst = bool();

    expect(inst.getDefault()).to.equal(undefined);
    inst.default(true).required().getDefault().should.equal(true);
  });

  it('should type check', () => {
    let inst = bool();

    inst.isType(1).should.equal(false);
    inst.isType(false).should.equal(true);
    inst.isType('true').should.equal(false);
    inst.isType(NaN).should.equal(false);
    inst.isType(new Number('foooo')).should.equal(false);

    inst.isType(34545).should.equal(false);
    inst.isType(new Boolean(false)).should.equal(true);

    expect(inst.isType(null)).to.equal(false);

    inst.nullable().isType(null).should.equal(true);
  });

  it('bool should VALIDATE correctly', () => {
    let inst = bool().required();

    return Promise.all([
      bool().isValid('1').should.eventually().equal(true),
      bool().strict().isValid(null).should.eventually().equal(false),
      bool().nullable().isValid(null).should.eventually().equal(true),
      inst
        .validate()
        .should.be.rejected()
        .then((err) => {
          err.errors.length.should.equal(1);
          err.errors[0].should.contain('required');
        }),
    ]);
  });

  it('should check isTrue correctly', () => {
    return Promise.all([
      bool()
        .isTrue()
        .isValid(true)
        .should.eventually()
        .equal(true),
      bool()
        .isTrue()
        .isValid(false)
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should check isFalse correctly', () => {
    return Promise.all([
      bool()
        .isFalse()
        .isValid(false)
        .should.eventually()
        .equal(true),
      bool()
        .isFalse()
        .isValid(true)
        .should.eventually()
        .equal(false),
    ]);
  });
});
