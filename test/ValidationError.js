/* eslint-disable no-template-curly-in-string */
import ValidationError from '../src/ValidationError';

describe('ValidationError', () => {
  describe('formatError', () => {
    it('should insert the params into the message', () => {
      const str = ValidationError.formatError('Some message ${param}', {
        param: 'here',
      });
      str.should.contain('here');
    });

    it('should auto include any param named \'label\' or \'path\' as the \'path\' param', () => {
      const str = ValidationError.formatError('${path} goes here', {
        label: 'label',
      });
      str.should.contain('label');
    });

    it('should use \'this\' if a \'label\' or \'path\' param is not provided', () => {
      const str = ValidationError.formatError('${path} goes here', {});
      str.should.contain('this');
    });

    it('should return the validation function if only a message is provided', () => {
      const str = ValidationError.formatError('${path} goes here')({});
      str.should.contain('this');
    });

    it('should include "undefined" in the message if undefined is provided as a param', () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: undefined,
      });
      str.should.contain('undefined');
    });

    it('should include "null" in the message if null is provided as a param', () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: null,
      });
      str.should.contain('null');
    });

    it('should include "NaN" in the message if null is provided as a param', () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: NaN,
      });
      str.should.contain('NaN');
    });

    it('should include 0 in the message if 0 is provided as a param', () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: 0,
      });
      str.should.contain('0');
    });
  });
});
