import { setLocale } from '../src/customLocale';
import { mixed } from '../src';

describe('Custom locale', () => {
  it('should get default locale', () => {
    const locale = require('../src/locale').default;
    expect(locale.string.email).to.equal('${path} must be a valid email');
  });

  it('should set a new locale', () => {
    const locale = require('../src/locale').default;
    const dict = {
      string: {
        email: 'Invalid email',
      },
    };

    setLocale(dict);

    expect(locale.string.email).to.equal(dict.string.email);
  });

  it('should update the main locale', () => {
    const locale = require('../src/locale').default;
    expect(locale.string.email).to.equal('Invalid email');
  });

  it('should be able to change locale at runtime', async () => {
    const myCustomLocale = {
      mixed: {
        default: 'my custom message',
      },
    };

    let inst = mixed()
      .test('test', null, () => false)
      .label('field');

    let error = await inst.validate('value').should.be.rejected();
    error.message.should.equal('field is invalid');

    setLocale(myCustomLocale);
    error = await inst.validate('value').should.be.rejected();
    error.message.should.equal(myCustomLocale.mixed.default);
  });
});
