import * as TestHelpers from './helpers';

import { string, number, object, ref } from '../src';

describe('String types', () => {
  describe('casting', () => {
    const schema = string();

    TestHelpers.castAll(schema, {
      valid: [
        [5, '5'],
        ['3', '3'],
        // [new String('foo'), 'foo'],
        ['', ''],
        [true, 'true'],
        [false, 'false'],
        [0, '0'],
        [null, null, schema.nullable()],
      ],
      invalid: [
        null,
      ],
    });

    describe('ensure', () => {
      const stringSchema = string().ensure();

      TestHelpers.castAll(
        stringSchema,
        {
          valid: [
            [5, '5'],
            ['3', '3'],
            [null, ''],
            [undefined, ''],
            [null, '', stringSchema.default('foo')],
            [undefined, 'foo', stringSchema.default('foo')],
          ],
        },
      );
    });

    it('should trim', () => {
      schema.trim().cast(' 3  ').should.equal('3');
    });

    it('should transform to lowercase', () => {
      schema.lowercase()
        .cast('HellO JohN')
        .should.equal('hello john');
    });
    it('should transform to lowercase', () => {
      schema.uppercase()
        .cast('HellO JohN')
        .should.equal('HELLO JOHN');
    });

    it('should handle nulls', () => {
      expect(schema.nullable()
        .trim()
        .lowercase()
        .uppercase()
        .cast(null)).to.equal(null);
    });
  });

  it('should handle DEFAULT', () => {
    const inst = string();

    inst.default('my_value').required().default().should.equal('my_value');
  });

  it('should type check', () => {
    const inst = string();

    inst.isType('5').should.equal(true);
    inst.isType(String('5')).should.equal(true);
    inst.isType(false).should.equal(false);
    inst.isType(null).should.equal(false);
    inst.nullable(false).isType(null).should.equal(false);
  });

  it('should VALIDATE correctly', () => {
    const inst = string().required().min(4).strict();

    return Promise.all([

      string().strict().isValid(null).should.eventually().equal(false),

      string().strict().nullable(true).isValid(null).should.eventually().equal(true),

      inst.isValid('hello').should.eventually().equal(true),

      inst.isValid('hel').should.eventually().equal(false),

      inst.validate('').should.be.rejected().then((err) => {
        err.errors.length.should.equal(1);
      }),
    ]);
  });

  it('should check MATCHES correctly', () => {
    const v = string().matches(/(hi|bye)/);

    return Promise.all([
      v.isValid('hi').should.eventually().equal(true),
      v.isValid('nope').should.eventually().equal(false),
      v.isValid('bye').should.eventually().equal(true),
    ]);
  });

  it('MATCHES should include empty strings', () => {
    const v = string().matches(/(hi|bye)/);

    return v.isValid('').should.eventually().equal(false);
  });

  it('MATCHES should exclude empty strings', () => {
    const v = string().matches(/(hi|bye)/, { excludeEmptyString: true });

    return v.isValid('').should.eventually().equal(true);
  });

  it('EMAIL should exclude empty strings', () => {
    const v = string().email();

    return v.isValid('').should.eventually().equal(true);
  });

  it('should check MIN correctly', () => {
    const v = string().min(5);
    const obj = object({
      len: number(),
      name: string().min(ref('len')),
    });

    return Promise.all([
      v.isValid('hiiofff').should.eventually().equal(true),
      v.isValid('big').should.eventually().equal(false),
      v.isValid('noffasfasfasf saf').should.eventually().equal(true),

      v.isValid(null).should.eventually().equal(false), // null -> ''
      v.nullable().isValid(null).should.eventually().equal(true), // null -> null

      obj.isValid({ len: 10, name: 'john' }).should.eventually().equal(false),
    ]);
  });

  it('should check MAX correctly', () => {
    const v = string().max(5);
    const obj = object({
      len: number(),
      name: string().max(ref('len')),
    });
    return Promise.all([
      v.isValid('adgf').should.eventually().equal(true),
      v.isValid('bigdfdsfsdf').should.eventually().equal(false),
      v.isValid('no').should.eventually().equal(true),

      v.isValid(null).should.eventually().equal(false),

      v.nullable().isValid(null).should.eventually().equal(true),

      obj.isValid({ len: 3, name: 'john' }).should.eventually().equal(false),
    ]);
  });

  it('should check LENGTH correctly', () => {
    const v = string().length(5);
    const obj = object({
      len: number(),
      name: string().length(ref('len')),
    });

    return Promise.all([
      v.isValid('exact').should.eventually().equal(true),
      v.isValid('sml').should.eventually().equal(false),
      v.isValid('biiiig').should.eventually().equal(false),

      v.isValid(null).should.eventually().equal(false),
      v.nullable().isValid(null).should.eventually().equal(true),

      obj.isValid({ len: 5, name: 'foo' }).should.eventually().equal(false),

    ]);
  });

  it('should validate transforms', () => Promise.all([
    string().trim().isValid(' 3  ').should.eventually().equal(true),

    string().lowercase().isValid('HellO JohN').should.eventually().equal(true),

    string().uppercase().isValid('HellO JohN').should.eventually().equal(true),

    string().trim().isValid(' 3  ', { strict: true })
      .should.eventually().equal(false),

    string().lowercase().isValid('HellO JohN', { strict: true })
      .should.eventually().equal(false),

    string().uppercase().isValid('HellO JohN', { strict: true })
      .should.eventually().equal(false),
  ]));
});
