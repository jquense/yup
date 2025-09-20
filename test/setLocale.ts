import { describe, it, expect } from 'vitest';
import { setLocale } from '../src';
import locale from '../src/locale';

describe('Custom locale', () => {
  it('should get default locale', () => {
    expect(locale.string?.email).toBe('${path} must be a valid email');
  });

  it('should set a new locale', () => {
    const dict = {
      string: {
        email: 'Invalid email',
      },
    };

    setLocale(dict);

    expect(locale.string?.email).toBe(dict.string.email);
  });

  it('should update the main locale', () => {
    expect(locale.string?.email).toBe('Invalid email');
  });

  it('should not allow prototype pollution', () => {
    const payload = JSON.parse(
      '{"__proto__":{"polluted":"Yes! Its Polluted"}}',
    );

    expect(() => setLocale(payload)).toThrowError();

    expect(payload).not.toHaveProperty('polluted');
  });

  it('should not pollute Object.prototype builtins', () => {
    const payload: any = { toString: { polluted: 'oh no' } };

    expect(() => setLocale(payload)).toThrowError();

    expect(Object.prototype.toString).not.toHaveProperty('polluted');
  });
});
