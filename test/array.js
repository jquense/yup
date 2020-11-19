import string from '../src/string';
import number from '../src/number';
import object from '../src/object';
import array from '../src/array';

describe('Array types', () => {
  describe('casting', () => {
    it('should parse json strings', () => {
      array().cast('[2,3,5,6]').should.eql([2, 3, 5, 6]);
    });

    it('should return null for failed casts', () => {
      expect(array().cast('asfasf', { assert: false })).to.equal(null);

      expect(array().cast(null, { assert: false })).to.equal(null);
    });

    it('should recursively cast fields', () => {
      array().of(number()).cast(['4', '5']).should.eql([4, 5]);

      array()
        .of(string())
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
    var inst = array();

    inst.isType([]).should.equal(true);
    inst.isType({}).should.equal(false);
    inst.isType('true').should.equal(false);
    inst.isType(NaN).should.equal(false);
    inst.isType(34545).should.equal(false);

    expect(inst.isType(null)).to.equal(false);

    inst.nullable().isType(null).should.equal(true);
  });

  it('should cast children', () => {
    array().of(number()).cast(['1', '3']).should.eql([1, 3]);
  });

  it('should concat subType correctly', () => {
    expect(array().of(number()).concat(array())._subType).to.exist();

    expect(array().of(number()).concat(array().of(false))._subType).to.equal(
      false,
    );
  });

  it('should pass options to children', () => {
    array(object({ name: string() }))
      .cast([{ id: 1, name: 'john' }], { stripUnknown: true })
      .should.eql([{ name: 'john' }]);
  });

  describe('validation', () => {
    test.each([
      ['missing', undefined, array().defined()],
      ['required', undefined, array().required()],
      ['required', null, array().required()],
      ['null', null, array()],
      ['length', [1, 2, 3], array().length(2)],
    ])('Basic validations fail: %s %p', async (type, value, schema) => {
      expect(await schema.isValid(value)).to.equal(false);
    });

    test.each([
      ['missing', [], array().defined()],
      ['required', [], array().required()],
      ['nullable', null, array().nullable()],
      ['length', [1, 2, 3], array().length(3)],
    ])('Basic validations pass: %s %p', async (type, value, schema) => {
      expect(await schema.isValid(value)).to.equal(true);
    });

    it('should allow undefined', async () => {
      await array().of(number().max(5)).isValid().should.become(true);
    });

    it('max should replace earlier tests', async () => {
      expect(await array().max(4).max(10).isValid(Array(5).fill(0))).to.equal(
        true,
      );
    });

    it('min should replace earlier tests', async () => {
      expect(await array().min(10).min(4).isValid(Array(5).fill(0))).to.equal(
        true,
      );
    });

    it('should respect subtype validations', async () => {
      var inst = array().of(number().max(5));

      await inst.isValid(['gg', 3]).should.become(false);
      await inst.isValid([7, 3]).should.become(false);

      let value = await inst.validate(['4', 3]);

      value.should.eql([4, 3]);
    });

    it('should prevent recursive casting', async () => {
      let castSpy = sinon.spy(string.prototype, '_cast');

      let value = await array(string()).validate([5]);

      value[0].should.equal('5');

      castSpy.should.have.been.calledOnce();
      string.prototype._cast.restore();
    });
  });

  it('should respect abortEarly', () => {
    var inst = array()
      .of(object({ str: string().required() }))
      .test('name', 'oops', () => false);

    return Promise.all([
      // inst
      //   .validate([{ str: '' }])
      //   .should.be.rejected()
      //   .then(err => {
      //     err.value.should.eql([{ str: '' }]);
      //     err.errors.length.should.equal(1);
      //     err.errors.should.eql(['oops']);
      //   }),
      inst
        .validate([{ str: '' }], { abortEarly: false })
        .should.be.rejected()
        .then((err) => {
          err.value.should.eql([{ str: '' }]);
          err.errors.length.should.equal(2);
          err.errors.should.eql(['[0].str is a required field', 'oops']);
        }),
    ]);
  });

  it('should compact arrays', () => {
    var arr = ['', 1, 0, 4, false, null],
      inst = array();

    inst.compact().cast(arr).should.eql([1, 4]);

    inst
      .compact((v) => v == null)
      .cast(arr)
      .should.eql(['', 1, 0, 4, false]);
  });

  it('should ensure arrays', () => {
    var inst = array().ensure();

    const a = [1, 4];
    inst.cast(a).should.equal(a);

    inst.cast(null).should.eql([]);
    // nullable is redundant since this should always produce an array
    // but we want to ensure that null is actually turned into an array
    inst.nullable().cast(null).should.eql([]);

    inst.cast(1).should.eql([1]);
    inst.nullable().cast(1).should.eql([1]);
  });

  it('should pass resolved path to descendants', async () => {
    let value = ['2', '3'];
    let expectedPaths = ['[0]', '[1]'];

    let itemSchema = string().when([], function (_, context) {
      let path = context.path || '';
      path.should.be.oneOf(expectedPaths);
      return string().required();
    });

    await array().of(itemSchema).validate(value);
  });

  it('should maintain array sparseness through validation', async () => {
    let sparseArray = new Array(2);
    sparseArray[1] = 1;
    let value = await array().of(number()).validate(sparseArray);
    expect(0 in sparseArray).to.be.false();
    expect(0 in value).to.be.false();
    // eslint-disable-next-line no-sparse-arrays
    value.should.eql([, 1]);
  });

  it('should validate empty slots in sparse array', async () => {
    let sparseArray = new Array(2);
    sparseArray[1] = 1;
    await array()
      .of(number().required())
      .isValid(sparseArray)
      .should.become(false);
  });
});
