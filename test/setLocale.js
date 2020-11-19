import { setLocale } from '../src';

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

  it('should not allow prototype pollution', () => {
    const payload = JSON.parse('{"__proto__":{"polluted":"Yes! Its Polluted"}}');

    expect(() => setLocale(payload)).to.throw();

    expect(payload).not.to.have.property('polluted');
  });

  it('should not pollute Object.prototype builtins', () => {
    const payload = { toString: { polluted: 'oh no' } };

    expect(() => setLocale(payload)).to.throw();

    expect(Object.prototype.toString).not.to.have.property('polluted');
  });
});
