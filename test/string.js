import * as TestHelpers from './helpers';

import { string, number, object, ref } from '../src';

describe('String types', () => {
  describe('casting', () => {
    let schema = string();

    TestHelpers.castAll(schema, {
      valid: [
        [5, '5'],
        ['3', '3'],
        //[new String('foo'), 'foo'],
        ['', ''],
        [true, 'true'],
        [false, 'false'],
        [0, '0'],
        [null, null, schema.nullable()],
      ],
      invalid: [null],
    });

    describe('ensure', () => {
      let schema = string().ensure();

      TestHelpers.castAll(schema, {
        valid: [
          [5, '5'],
          ['3', '3'],
          [null, ''],
          [undefined, ''],
          [null, '', schema.default('foo')],
          [undefined, 'foo', schema.default('foo')],
        ],
      });
    });

    it('should trim', () => {
      schema
        .trim()
        .cast(' 3  ')
        .should.equal('3');
    });

    it('should transform to lowercase', () => {
      schema
        .lowercase()
        .cast('HellO JohN')
        .should.equal('hello john');
    });

    it('should transform to uppercase', () => {
      schema
        .uppercase()
        .cast('HellO JohN')
        .should.equal('HELLO JOHN');
    });

    it('should handle nulls', () => {
      expect(
        schema
          .nullable()
          .trim()
          .lowercase()
          .uppercase()
          .cast(null),
      ).to.equal(null);
    });
  });

  it('should handle DEFAULT', function() {
    var inst = string();

    inst
      .default('my_value')
      .required()
      .default()
      .should.equal('my_value');
  });

  it('should type check', function() {
    var inst = string();

    inst.isType('5').should.equal(true);
    inst.isType(new String('5')).should.equal(true);
    inst.isType(false).should.equal(false);
    inst.isType(null).should.equal(false);
    inst
      .nullable(false)
      .isType(null)
      .should.equal(false);
  });

  it('should VALIDATE correctly', function() {
    var inst = string()
      .required()
      .min(4)
      .strict();

    return Promise.all([
      string()
        .strict()
        .isValid(null)
        .should.eventually()
        .equal(false),

      string()
        .strict()
        .nullable(true)
        .isValid(null)
        .should.eventually()
        .equal(true),

      inst
        .isValid('hello')
        .should.eventually()
        .equal(true),

      inst
        .isValid('hel')
        .should.eventually()
        .equal(false),

      inst
        .validate('')
        .should.be.rejected()
        .then(function(err) {
          err.errors.length.should.equal(1);
        }),
    ]);
  });

  it('should check MATCHES correctly', function() {
    var v = string().matches(/(hi|bye)/);

    return Promise.all([
      v
        .isValid('hi')
        .should.eventually()
        .equal(true),
      v
        .isValid('nope')
        .should.eventually()
        .equal(false),
      v
        .isValid('bye')
        .should.eventually()
        .equal(true),
    ]);
  });

  it('should check MATCHES correctly with global and sticky flags', function() {
    var v = string().matches(/hi/gy);

    return Promise.all([
      v
        .isValid('hi')
        .should.eventually()
        .equal(true),
      v
        .isValid('hi')
        .should.eventually()
        .equal(true),
    ]);
  });

  it('MATCHES should include empty strings', () => {
    let v = string().matches(/(hi|bye)/);

    return v
      .isValid('')
      .should.eventually()
      .equal(false);
  });

  it('MATCHES should exclude empty strings', () => {
    let v = string().matches(/(hi|bye)/, { excludeEmptyString: true });

    return v
      .isValid('')
      .should.eventually()
      .equal(true);
  });

  it('EMAIL should exclude empty strings', () => {
    let v = string().email();

    return v
      .isValid('')
      .should.eventually()
      .equal(true);
  });

  it('EMAIL should match valid email formats', () => {
    const v = string().email();
    const emails = [
      'simple@example.com',
      'very.common@example.com',
      'disposable.style.email.with+symbol@example.com',
      'other.email-with-hyphen@example.com',
      'fully-qualified-domain@example.com',
      // may go to user.name@example.com inbox depending on mail server
      'user.name+tag+sorting@example.com',
      // one-letter local-part
      'x@example.com',
      'example-indeed@strange-example.com',
      // local domain name with no TLD, although ICANN highly discourages dotless email addresses (so we won't include it)
      // 'admin@mailserver1'
      // see the List of Internet top-level domains
      'example@s.example',
      // space between the quotes
      '" "@example.org',
      // quoted double dot
      '"john..doe"@example.org',
      // bangified host route used for uucp mailers
      'mailhost!username@example.org',
      // % escaped mail route to user@example.com via example.org
      'user%example.com@example.org',
    ];

    return Promise.all(
      emails.map(email =>
        v
          .isValid(email)
          .should.eventually()
          .equal(true),
      ),
    );
  });

  it('EMAIL should not match invalid email formats', () => {
    const v = string().email();
    const emails = [
      // no @ character
      'Abc.example.com',
      // only one @ is allowed outside quotation marks
      'A@b@c@example.com',
      // only one dot is allowed
      'A@b@c@example..com',
      'A@b@c@example.com..au',
      // none of the special characters in this local-part are allowed outside quotation marks
      'a"b(c)d,e:f;g<h>i[j\\k]l@example.com',
      // quoted strings must be dot separated or the only element making up the local-part
      'just"not"right@example.com',
      // spaces, quotes, and backslashes may only exist when within quoted strings and preceded by a backslash
      // eslint-disable-next-line no-useless-escape
      'this is"notallowed@example.com',
      // even if escaped (preceded by a backslash), spaces, quotes, and backslashes must still be contained by quotes
      // eslint-disable-next-line no-useless-escape
      'this still"not\\allowed@example.com',
      // local part is longer than 64 characters
      '1234567890123456789012345678901234567890123456789012345678901234+x@example.com',
    ];

    return Promise.all(
      emails.map(email =>
        v
          .isValid(email)
          .should.eventually()
          .equal(false),
      ),
    );
  });

  it('should check MIN correctly', function() {
    var v = string().min(5);
    var obj = object({
      len: number(),
      name: string().min(ref('len')),
    });

    return Promise.all([
      v
        .isValid('hiiofff')
        .should.eventually()
        .equal(true),
      v
        .isValid('big')
        .should.eventually()
        .equal(false),
      v
        .isValid('noffasfasfasf saf')
        .should.eventually()
        .equal(true),

      v
        .isValid(null)
        .should.eventually()
        .equal(false), // null -> ''
      v
        .nullable()
        .isValid(null)
        .should.eventually()
        .equal(true), // null -> null

      obj
        .isValid({ len: 10, name: 'john' })
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should check MAX correctly', function() {
    var v = string().max(5);
    var obj = object({
      len: number(),
      name: string().max(ref('len')),
    });
    return Promise.all([
      v
        .isValid('adgf')
        .should.eventually()
        .equal(true),
      v
        .isValid('bigdfdsfsdf')
        .should.eventually()
        .equal(false),
      v
        .isValid('no')
        .should.eventually()
        .equal(true),

      v
        .isValid(null)
        .should.eventually()
        .equal(false),

      v
        .nullable()
        .isValid(null)
        .should.eventually()
        .equal(true),

      obj
        .isValid({ len: 3, name: 'john' })
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should check LENGTH correctly', function() {
    var v = string().length(5);
    var obj = object({
      len: number(),
      name: string().length(ref('len')),
    });

    return Promise.all([
      v
        .isValid('exact')
        .should.eventually()
        .equal(true),
      v
        .isValid('sml')
        .should.eventually()
        .equal(false),
      v
        .isValid('biiiig')
        .should.eventually()
        .equal(false),

      v
        .isValid(null)
        .should.eventually()
        .equal(false),
      v
        .nullable()
        .isValid(null)
        .should.eventually()
        .equal(true),

      obj
        .isValid({ len: 5, name: 'foo' })
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should check url correctly', function() {
    var v = string().url();

    return Promise.all([
      v
        .isValid('//www.github.com/')
        .should.eventually()
        .equal(true),
      v
        .isValid('https://www.github.com/')
        .should.eventually()
        .equal(true),
      v
        .isValid('this is not a url')
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should validate transforms', function() {
    return Promise.all([
      string()
        .trim()
        .isValid(' 3  ')
        .should.eventually()
        .equal(true),

      string()
        .lowercase()
        .isValid('HellO JohN')
        .should.eventually()
        .equal(true),

      string()
        .uppercase()
        .isValid('HellO JohN')
        .should.eventually()
        .equal(true),

      string()
        .trim()
        .isValid(' 3  ', { strict: true })
        .should.eventually()
        .equal(false),

      string()
        .lowercase()
        .isValid('HellO JohN', { strict: true })
        .should.eventually()
        .equal(false),

      string()
        .uppercase()
        .isValid('HellO JohN', { strict: true })
        .should.eventually()
        .equal(false),
    ]);
  });
});
