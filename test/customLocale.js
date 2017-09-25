import { setLocale, getLocale } from '../src/customLocale';

describe('Custom locale', () => {
  it('should set a new locale', () => {
    const dict = {
      string: {
        email: 'Invalid email',
      },
    };

    setLocale(dict);

    expect(getLocale()).to.deep.equal(dict);
  });

  it('should update the main locale', () => {
    const locale = require('../src/locale').default; // eslint-disable-line global-require
    expect(locale.string).to.deep.include(getLocale().string);
  });
});
