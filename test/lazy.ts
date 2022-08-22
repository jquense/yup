import { lazy, mixed, AnyObject, MixedSchema } from '../src';

describe('lazy', function () {
  it('should throw on a non-schema value', () => {
    // @ts-expect-error testing incorrect usage
    expect(() => lazy(() => undefined).validate(undefined)).toThrowError();
  });

  describe('mapper', () => {
    const value = 1;
    let mapper: jest.Mock<MixedSchema<any, AnyObject, undefined, ''>, []>;

    beforeEach(() => {
      mapper = jest.fn(() => mixed());
    });

    it('should call with value', () => {
      lazy(mapper).validate(value);
      expect(mapper).toHaveBeenCalledWith(value, expect.any(Object));
    });

    it('should call with context', () => {
      const context = {
        a: 1,
      };
      let options = { context };
      lazy(mapper).validate(value, options);
      expect(mapper).toHaveBeenCalledWith(value, options);
    });

    it('should allow meta', () => {
      const meta = { a: 1 };
      const schema = lazy(mapper).meta(meta);

      expect(schema.meta()).toEqual(meta);

      expect(schema.meta({ added: true })).not.toEqual(schema.meta());

      expect(schema.meta({ added: true }).meta()).toEqual({
        a: 1,
        added: true,
      });
    });
  });
});
