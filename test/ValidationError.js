import ValidationError from '../src/ValidationError';

describe('ValidationError', function () {
  describe('formatError', function () {
    it('should insert the params into the message', function () {
      const str = ValidationError.formatError('Some message ${param}', {
        param: 'here',
      });
      expect(str).toContain('here');
    });

    it(`should auto include any param named 'label' or 'path' as the 'path' param`, function () {
      const str = ValidationError.formatError('${path} goes here', {
        label: 'label',
      });
      expect(str).toContain('label');
    });

    it(`should use 'this' if a 'label' or 'path' param is not provided`, function () {
      const str = ValidationError.formatError('${path} goes here', {});
      expect(str).toContain('this');
    });

    it(`should include "undefined" in the message if undefined is provided as a param`, function () {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: undefined,
      });
      expect(str).toContain('undefined');
    });

    it(`should include "null" in the message if null is provided as a param`, function () {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: null,
      });
      expect(str).toContain('null');
    });

    it(`should include "NaN" in the message if null is provided as a param`, function () {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: NaN,
      });
      expect(str).toContain('NaN');
    });

    it(`should include 0 in the message if 0 is provided as a param`, function () {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: 0,
      });
      expect(str).toContain('0');
    });
  });
});
