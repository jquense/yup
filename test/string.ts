import * as TestHelpers from './helpers';

import {
  string,
  number,
  object,
  ref,
  ValidationError,
  AnySchema,
} from '../src';

describe('String types', () => {
  describe('casting', () => {
    let schema = string();

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
        [
          {
            toString: () => 'hey',
          },
          'hey',
        ],
      ],
      invalid: [null, {}, []],
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
      expect(schema.trim().cast(' 3  ')).toBe('3');
    });

    it('should transform to lowercase', () => {
      expect(schema.lowercase().cast('HellO JohN')).toBe('hello john');
    });

    it('should transform to uppercase', () => {
      expect(schema.uppercase().cast('HellO JohN')).toBe('HELLO JOHN');
    });

    it('should handle nulls', () => {
      expect(
        schema.nullable().trim().lowercase().uppercase().cast(null),
      ).toBeNull();
    });
  });

  it('should handle DEFAULT', function () {
    let inst = string();

    expect(inst.default('my_value').required().getDefault()).toBe('my_value');
  });

  it('should type check', function () {
    let inst = string();

    expect(inst.isType('5')).toBe(true);
    expect(inst.isType(new String('5'))).toBe(true);
    expect(inst.isType(false)).toBe(false);
    expect(inst.isType(null)).toBe(false);
    expect(inst.nullable().isType(null)).toBe(true);
  });

  it('should VALIDATE correctly', function () {
    let inst = string().required().min(4).strict();

    return Promise.all([
      expect(string().strict().isValid(null)).resolves.toBe(false),

      expect(string().strict().nullable().isValid(null)).resolves.toBe(true),

      expect(inst.isValid('hello')).resolves.toBe(true),

      expect(inst.isValid('hel')).resolves.toBe(false),

      expect(inst.validate('')).rejects.toEqual(
        TestHelpers.validationErrorWithMessages(expect.any(String)),
      ),
    ]);
  });

  it('should handle NOTREQUIRED correctly', function () {
    let v = string().required().notRequired();

    return Promise.all([
      expect(v.isValid(undefined)).resolves.toBe(true),
      expect(v.isValid('')).resolves.toBe(true),
    ]);
  });

  it('should check MATCHES correctly', function () {
    let v = string().matches(/(hi|bye)/, 'A message');

    return Promise.all([
      expect(v.isValid('hi')).resolves.toBe(true),
      expect(v.isValid('nope')).resolves.toBe(false),
      expect(v.isValid('bye')).resolves.toBe(true),
    ]);
  });

  it('should check MATCHES correctly with global and sticky flags', function () {
    let v = string().matches(/hi/gy);

    return Promise.all([
      expect(v.isValid('hi')).resolves.toBe(true),
      expect(v.isValid('hi')).resolves.toBe(true),
    ]);
  });

  it('MATCHES should include empty strings', () => {
    let v = string().matches(/(hi|bye)/);

    return expect(v.isValid('')).resolves.toBe(false);
  });

  it('MATCHES should exclude empty strings', () => {
    let v = string().matches(/(hi|bye)/, { excludeEmptyString: true });

    return expect(v.isValid('')).resolves.toBe(true);
  });

  it('EMAIL should exclude empty strings', () => {
    let v = string().email();

    return expect(v.isValid('')).resolves.toBe(true);
  });

  it('should check MIN correctly', function () {
    let v = string().min(5);
    let obj = object({
      len: number(),
      name: string().min(ref('len')),
    });

    return Promise.all([
      expect(v.isValid('hiiofff')).resolves.toBe(true),
      expect(v.isValid('big')).resolves.toBe(false),
      expect(v.isValid('noffasfasfasf saf')).resolves.toBe(true),

      expect(v.isValid(null)).resolves.toBe(false),
      expect(v.nullable().isValid(null)).resolves.toBe(true),

      expect(obj.isValid({ len: 10, name: 'john' })).resolves.toBe(false),
    ]);
  });

  it('should check MAX correctly', function () {
    let v = string().max(5);
    let obj = object({
      len: number(),
      name: string().max(ref('len')),
    });
    return Promise.all([
      expect(v.isValid('adgf')).resolves.toBe(true),
      expect(v.isValid('bigdfdsfsdf')).resolves.toBe(false),
      expect(v.isValid('no')).resolves.toBe(true),

      expect(v.isValid(null)).resolves.toBe(false),

      expect(v.nullable().isValid(null)).resolves.toBe(true),

      expect(obj.isValid({ len: 3, name: 'john' })).resolves.toBe(false),
    ]);
  });

  it('should check LENGTH correctly', function () {
    let v = string().length(5);
    let obj = object({
      len: number(),
      name: string().length(ref('len')),
    });

    return Promise.all([
      expect(v.isValid('exact')).resolves.toBe(true),
      expect(v.isValid('sml')).resolves.toBe(false),
      expect(v.isValid('biiiig')).resolves.toBe(false),

      expect(v.isValid(null)).resolves.toBe(false),
      expect(v.nullable().isValid(null)).resolves.toBe(true),

      expect(obj.isValid({ len: 5, name: 'foo' })).resolves.toBe(false),
    ]);
  });

  it('should check url correctly', function () {
    let v = string().url();

    return Promise.all([
      expect(v.isValid('//www.github.com/')).resolves.toBe(true),
      expect(v.isValid('https://www.github.com/')).resolves.toBe(true),
      expect(v.isValid('this is not a url')).resolves.toBe(false),
    ]);
  });

  it('should check UUID correctly', function () {
    let v = string().uuid();

    return Promise.all([
      expect(v.isValid('0c40428c-d88d-4ff0-a5dc-a6755cb4f4d1')).resolves.toBe(
        true,
      ),
      expect(v.isValid('42c4a747-3e3e-42be-af30-469cfb9c1913')).resolves.toBe(
        true,
      ),
      expect(v.isValid('42c4a747-3e3e-zzzz-af30-469cfb9c1913')).resolves.toBe(
        false,
      ),
      expect(v.isValid('this is not a uuid')).resolves.toBe(false),
      expect(v.isValid('')).resolves.toBe(false),
    ]);
  });

  describe('DATETIME', function () {
    it('should check DATETIME correctly', function () {
      let v = string().datetime();

      return Promise.all([
        expect(v.isValid('2023-01-09T12:34:56Z')).resolves.toBe(true),
        expect(v.isValid('1977-00-28T12:34:56.0Z')).resolves.toBe(true),
        expect(v.isValid('1900-10-29T12:34:56.00Z')).resolves.toBe(true),
        expect(v.isValid('1000-11-30T12:34:56.000Z')).resolves.toBe(true),
        expect(v.isValid('4444-12-31T12:34:56.0000Z')).resolves.toBe(true),

        // Should not allow time zone offset by default
        expect(v.isValid('2010-04-10T14:06:14+00:00')).resolves.toBe(false),
        expect(v.isValid('2000-07-11T21:06:14+07:00')).resolves.toBe(false),
        expect(v.isValid('1999-08-16T07:06:14-07:00')).resolves.toBe(false),

        expect(v.isValid('this is not a datetime')).resolves.toBe(false),
        expect(v.isValid('2023-08-16T12:34:56')).resolves.toBe(false),
        expect(v.isValid('2023-08-1612:34:56Z')).resolves.toBe(false),
        expect(v.isValid('1970-01-01 00:00:00Z')).resolves.toBe(false),
        expect(v.isValid('1970-01-01T00:00:00,000Z')).resolves.toBe(false),
        expect(v.isValid('1970-01-01T0000')).resolves.toBe(false),
        expect(v.isValid('1970-01-01T00:00.000')).resolves.toBe(false),
        expect(v.isValid('2023-01-09T12:34:56.Z')).resolves.toBe(false),
        expect(v.isValid('2023-08-16')).resolves.toBe(false),
        expect(v.isValid('1970-as-df')).resolves.toBe(false),
        expect(v.isValid('19700101')).resolves.toBe(false),
        expect(v.isValid('197001')).resolves.toBe(false),
      ]);
    });

    it('should support DATETIME allowOffset option', function () {
      let v = string().datetime({ allowOffset: true });

      return Promise.all([
        expect(v.isValid('2023-01-09T12:34:56Z')).resolves.toBe(true),
        expect(v.isValid('2010-04-10T14:06:14+00:00')).resolves.toBe(true),
        expect(v.isValid('2000-07-11T21:06:14+07:00')).resolves.toBe(true),
        expect(v.isValid('1999-08-16T07:06:14-07:00')).resolves.toBe(true),
        expect(v.isValid('1970-01-01T00:00:00+0630')).resolves.toBe(true),
      ]);
    });

    it('should support DATETIME precision option', function () {
      let v = string().datetime({ precision: 4 });

      return Promise.all([
        expect(v.isValid('2023-01-09T12:34:56.0000Z')).resolves.toBe(true),
        expect(v.isValid('2023-01-09T12:34:56.00000Z')).resolves.toBe(false),
        expect(v.isValid('2023-01-09T12:34:56.000Z')).resolves.toBe(false),
        expect(v.isValid('2023-01-09T12:34:56.00Z')).resolves.toBe(false),
        expect(v.isValid('2023-01-09T12:34:56.0Z')).resolves.toBe(false),
        expect(v.isValid('2023-01-09T12:34:56.Z')).resolves.toBe(false),
        expect(v.isValid('2023-01-09T12:34:56Z')).resolves.toBe(false),
        expect(v.isValid('2010-04-10T14:06:14.0000+00:00')).resolves.toBe(
          false,
        ),
      ]);
    });

    describe('DATETIME error strings', function () {
      function getErrorString(schema: AnySchema, value: string) {
        try {
          schema.validateSync(value);
          fail('should have thrown validation error');
        } catch (e) {
          const err = e as ValidationError;
          return err.errors[0];
        }
      }

      it('should use the default locale string on error', function () {
        let v = string().datetime();
        expect(getErrorString(v, 'asdf')).toBe(
          'this must be a valid ISO date-time',
        );
      });

      it('should use the allowOffset locale string on error when offset caused error', function () {
        let v = string().datetime();
        expect(getErrorString(v, '2010-04-10T14:06:14+00:00')).toBe(
          'this must be a valid ISO date-time with UTC "Z" timezone',
        );
      });

      it('should use the precision locale string on error when precision caused error', function () {
        let v = string().datetime({ precision: 2 });
        expect(getErrorString(v, '2023-01-09T12:34:56Z')).toBe(
          'this must be a valid ISO date-time with a sub-second precision of exactly 2 digits',
        );
      });

      it('should prefer options.message over all default error messages', function () {
        let msg = 'hello';
        let v = string().datetime({ message: msg });
        expect(getErrorString(v, 'asdf')).toBe(msg);
        expect(getErrorString(v, '2010-04-10T14:06:14+00:00')).toBe(msg);

        v = string().datetime({ message: msg, precision: 2 });
        expect(getErrorString(v, '2023-01-09T12:34:56Z')).toBe(msg);
      });
    });
  });

  xit('should check allowed values at the end', () => {
    return Promise.all([
      expect(
        string()
          .required('Required')
          .notOneOf([ref('$someKey')])
          .validate('', { context: { someKey: '' } }),
      ).rejects.toEqual(
        TestHelpers.validationErrorWithMessages(
          expect.stringContaining('Ref($someKey)'),
        ),
      ),
      expect(
        object({
          email: string().required('Email Required'),
          password: string()
            .required('Password Required')
            .notOneOf([ref('email')]),
        })
          .validate({ email: '', password: '' }, { abortEarly: false })
          .catch(console.log),
      ).rejects.toEqual(
        TestHelpers.validationErrorWithMessages(
          expect.stringContaining('Email Required'),
          expect.stringContaining('Password Required'),
        ),
      ),
    ]);
  });

  it('should validate transforms', function () {
    return Promise.all([
      expect(string().trim().isValid(' 3  ')).resolves.toBe(true),

      expect(string().lowercase().isValid('HellO JohN')).resolves.toBe(true),

      expect(string().uppercase().isValid('HellO JohN')).resolves.toBe(true),

      expect(string().trim().isValid(' 3  ', { strict: true })).resolves.toBe(
        false,
      ),

      expect(
        string().lowercase().isValid('HellO JohN', { strict: true }),
      ).resolves.toBe(false),

      expect(
        string().uppercase().isValid('HellO JohN', { strict: true }),
      ).resolves.toBe(false),
    ]);
  });
});
