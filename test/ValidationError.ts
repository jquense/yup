import ValidationError from '../src/ValidationError';

describe('ValidationError', () => {
  describe('formatError', () => {
    it('should insert the params into the message', () => {
      const str = ValidationError.formatError('Some message ${param}', {
        param: 'here',
      });
      expect(str).toContain('here');
    });

    it(`should auto include any param named 'label' or 'path' as the 'path' param`, () => {
      const str = ValidationError.formatError('${path} goes here', {
        label: 'label',
      });
      expect(str).toContain('label');
    });

    it(`should use 'this' if a 'label' or 'path' param is not provided`, () => {
      const str = ValidationError.formatError('${path} goes here', {});
      expect(str).toContain('this');
    });

    it(`should include "undefined" in the message if undefined is provided as a param`, () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: undefined,
      });
      expect(str).toContain('undefined');
    });

    it(`should include "null" in the message if null is provided as a param`, () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: null,
      });
      expect(str).toContain('null');
    });

    it(`should include "NaN" in the message if null is provided as a param`, () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: NaN,
      });
      expect(str).toContain('NaN');
    });

    it(`should include 0 in the message if 0 is provided as a param`, () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: 0,
      });
      expect(str).toContain('0');
    });
  });

  it('should disable stacks', () => {
    const disabled = new ValidationError('error', 1, 'field', 'type', true);

    expect(disabled.constructor.name).toEqual('ValidationErrorNoStack');
    expect(disabled).toBeInstanceOf(ValidationError);
  });
});
