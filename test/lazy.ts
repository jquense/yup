import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lazy, object, mixed, ValidationError } from '../src';

describe('lazy', function () {
  it('should throw on a non-schema value', () => {
    // @ts-expect-error testing incorrect usage
    expect(() => lazy(() => undefined).validateSync(undefined)).toThrowError();
  });

  describe('mapper', () => {
    const value = 1;
    let mapper: any;

    beforeEach(() => {
      mapper = vi.fn(() => mixed());
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

    it('should call with context when nested: #1799', () => {
      let context = { a: 1 };
      let value = { lazy: 1 };
      let options = { context };

      object({
        lazy: lazy(mapper),
      }).validate(value, options);

      lazy(mapper).validate(value, options);
      expect(mapper).toHaveBeenCalledWith(value, options);
    });

    it('should allow meta', () => {
      const meta = { a: 1 };
      const schema = lazy(mapper).meta(meta);

      expect(schema.meta()).toEqual(meta);

      const next = schema.meta({ added: true });
      expect(next).not.toBe(schema);
      expect(next.meta()).toEqual({
        a: 1,
        added: true,
      });
      expect(schema.meta()).toEqual(meta);
    });

    it('should keep metadata independent between branches', () => {
      const schema = lazy(mapper).meta({ label: 'base' });
      const first = schema.meta({ label: 'first' });
      const second = schema.meta({ label: 'second' });

      expect(schema.meta()).toEqual({ label: 'base' });
      expect(first.meta()).toEqual({ label: 'first' });
      expect(second.meta()).toEqual({ label: 'second' });
      expect(mapper).not.toHaveBeenCalled();
    });

    it('should deeply clone metadata', () => {
      const field = mixed();
      const meta = {
        settings: { label: 'base' },
        tags: ['first'],
        field,
      };
      const schema = lazy(mapper).meta(meta);
      const next = schema.clone();

      expect(next.meta()).toEqual(meta);
      expect(next.meta()).not.toBe(schema.meta());
      expect(next.meta()!.settings).not.toBe(schema.meta()!.settings);
      expect(next.meta()!.tags).not.toBe(schema.meta()!.tags);
      expect(next.meta()!.field).toBe(field);
      expect(mapper).not.toHaveBeenCalled();
    });

    it('should preserve metadata when making a lazy schema optional', () => {
      const schema = lazy(() => mixed().required()).meta({ label: 'base' });
      const next = schema.optional().meta({ label: 'optional' });

      expect(next.meta()).toEqual({ label: 'optional' });
      expect(schema.meta()).toEqual({ label: 'base' });
      expect(next.isValidSync(undefined)).toBe(true);
      expect(schema.isValidSync(undefined)).toBe(false);
    });

    it('should allow throwing validation error in builder', async () => {
      const schema = lazy(() => {
        throw new ValidationError('oops');
      });

      await expect(schema.validate(value)).rejects.toThrowError('oops');
      await expect(schema.isValid(value)).resolves.toEqual(false);

      expect(() => schema.validateSync(value)).toThrowError('oops');

      const schema2 = lazy(() => {
        throw new Error('error');
      });
      // none validation errors are thrown sync to maintain back compat
      expect(() => schema2.validate(value)).toThrowError('error');
      expect(() => schema2.isValid(value)).toThrowError('error');
    });
  });
});
