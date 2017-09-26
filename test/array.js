import string from '../src/string';
import number from '../src/number';
import object from '../src/object';
import array from '../src/array';

describe('Array types', () => {
  describe('casting', () => {
    it('should parse json strings', () => {
      array()
        .cast('[2,3,5,6]')
        .should.eql([2, 3, 5, 6]);
    });

    it('should return null for failed casts', () => {
      expect(
        array().cast('asfasf', { assert: false })).to.equal(null);

      expect(
        array().cast(null, { assert: false })).to.equal(null);
    });

    it('should recursively cast fields', () => {
      array().of(number())
        .cast(['4', '5'])
        .should.eql([4, 5]);

      array().of(string())
        .cast(['4', 5, false])
        .should.eql(['4', '5', 'false']);
    });
  });


  it('should handle DEFAULT', () => {
    expect(array().default()).to.equal(undefined);

    array()
      .default(() => [1, 2, 3])
      .default()
      .should.eql([1, 2, 3]);
  });

  it('should type check', () => {
    const inst = array();

    inst.isType([]).should.equal(true);
    inst.isType({}).should.equal(false);
    inst.isType('true').should.equal(false);
    inst.isType(NaN).should.equal(false);
    inst.isType(34545).should.equal(false);

    expect(
      inst.isType(null)).to.equal(false);

    inst.nullable().isType(null).should.equal(true);
  });

  it('should cast children', () => {
    array()
      .of(number())
      .cast(['1', '3']).should.eql([1, 3]);
  });

  it('should concat subType correctly', () => {
    expect(
      array()
        .of(number())
        .concat(array())
        ._subType,
    ).to.exist();

    expect(
      array()
        .of(number())
        .concat(array().of(false))
        ._subType,
    ).to.equal(false);
  });

  it('should pass options to children', () => {
    array(
      object({ name: string() }),
    )
      .cast([{ id: 1, name: 'john' }], { stripUnknown: true })
      .should.eql([{ name: 'john' }]);
  });

  describe('validation', () => {
    it('should allow undefined', async () => {
      await array().of(number().max(5))
        .isValid()
        .should.become(true);
    });

    it('should not allow null when not nullable', async () => {
      await array().isValid(null).should.become(false);

      await array().nullable().isValid(null).should.become(true);
    });

    it('should respect subtype validations', async () => {
      const inst = array()
        .of(number().max(5));

      await inst.isValid(['gg', 3]).should.become(false);
      await inst.isValid([7, 3]).should.become(false);

      const value = await inst.validate(['4', 3]);

      value.should.eql([4, 3]);
    });

    it('should prevent recursive casting', async () => {
      const castSpy = sinon.spy(string.prototype, '_cast');

      const value = await array(string())
        .validate([5]);

      value[0].should.equal('5');

      castSpy.should.have.been.calledOnce();
      string.prototype._cast.restore();
    });
  });


  it('should respect abortEarly', () => {
    const inst = array()
      .of(object({ str: string().required() }))
      .test('name', 'oops', () => false);

    return Promise.all([
      inst.validate([{ str: '' }]).should.be.rejected()
        .then((err) => {
          err.value.should.eql([{ str: '' }]);
          err.errors.length.should.equal(1);
          err.errors.should.eql(['oops']);
        }),

      inst.validate([{ str: '' }], { abortEarly: false }).should.be.rejected()
        .then((err) => {
          err.value.should.eql([{ str: '' }]);

          err.errors.length.should.equal(2);
          err.errors.should.eql(['[0].str is a required field', 'oops']);
        }),
    ]);
  });

  it('should compact arrays', () => {
    const arr = ['', 1, 0, 4, false, null];
    const inst = array();

    inst.compact().cast(arr)
      .should.eql([1, 4]);

    inst.compact(v => v == null)
      .cast(arr).should.eql(['', 1, 0, 4, false]);
  });

  it('should ensure arrays', () => {
    const inst = array().ensure();

    inst.cast([1, 4])
      .should.eql([1, 4]);

    inst.cast(null)
      .should.eql([]);
  });
});
