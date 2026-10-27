import { describe, expect, it } from 'vitest';
import { array, bool, lazy, number, object, ref, string } from '../src';

describe('nested conditional casting', () => {
  const orders = ['abc', 'acb', 'bac', 'bca', 'cab', 'cba'];

  it.each(orders.flatMap((order) => [true, 'true', 1].map((b) => [order, b])))(
    'casts nested dependencies for field order %s and value %s',
    async (order, b) => {
      const fields = {
        a: bool(),
        b: bool(),
        c: array().when('a', {
          is: true,
          then: (schema) =>
            schema.when('b', {
              is: true,
              then: (nested) => nested.compact().min(1),
            }),
        }),
      };
      const schema = object(
        Object.fromEntries(
          [...(order as string)].map((key) => [
            key,
            fields[key as keyof typeof fields],
          ]),
        ),
      );
      expect(schema.cast({ a: true, b, c: [''] }).c).toEqual([]);
      await expect(schema.isValid({ a: true, b, c: [''] })).resolves.toBe(
        false,
      );
      await expect(
        schema.isValid({ a: true, b: false, c: [''] }),
      ).resolves.toBe(true);
    },
  );

  it('reads defaults before selecting a nested branch', () => {
    const schema = object({
      a: bool(),
      b: bool().default(true),
      c: array().when('a', {
        is: true,
        then: (s) =>
          s.when('b', {
            is: undefined,
            then: (nested) =>
              nested.when('c', { is: undefined, then: (v) => v.min(1) }),
            otherwise: (nested) => nested.compact().min(1),
          }),
      }),
    });
    expect(schema.cast({ a: true, c: [''] })).toEqual({
      a: true,
      b: true,
      c: [],
    });
  });

  it('casts each field once and keeps the same plain parent', () => {
    const parents: unknown[] = [];
    let bCalls = 0;
    let cCalls = 0;
    const schema = object({
      a: bool(),
      b: number().transform((v, _, __, options) => {
        parents.push(options.parent);
        bCalls++;
        return v + 1;
      }),
      c: array()
        .when('a', {
          is: true,
          then: (s) =>
            s.when('b', ([b], nested, options) => {
              parents.push(options.parent);
              return b === 1 ? nested.compact() : nested;
            }),
        })
        .transform((v, _, __, options) => {
          parents.push(options.parent);
          cCalls++;
          return v;
        }),
    });
    const result = schema.cast({ a: true, b: 0, c: [''] });
    expect(result).toEqual({ a: true, b: 1, c: [] });
    expect(bCalls).toBe(1);
    expect(cCalls).toBe(1);
    expect(parents.every((parent) => parent === result)).toBe(true);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Reflect.ownKeys(result).sort()).toEqual(['a', 'b', 'c']);
  });

  it('resolves nested paths in lazy fields', () => {
    const schema = object({
      a: bool(),
      b: object({ enabled: bool() }),
      c: lazy(() =>
        array().when('a', {
          is: true,
          then: (s) =>
            s.when('b.enabled', {
              is: true,
              then: (nested) => nested.compact(),
            }),
        }),
      ),
    });
    expect(schema.cast({ a: true, b: { enabled: 'true' }, c: [''] })).toEqual({
      a: true,
      b: { enabled: true },
      c: [],
    });
  });

  it('rejects a dynamically discovered cycle', () => {
    const schema = object({
      a: bool(),
      b: array().when('a', {
        is: true,
        then: (s) => s.when('c', () => array()),
      }),
      c: array().when('a', {
        is: true,
        then: (s) => s.when('b', () => array()),
      }),
    });
    expect(() => schema.cast({ a: true, b: [], c: [] })).toThrowError(
      'Cyclic dependency',
    );
  });

  it.each(['d', 'd.enabled'])(
    'casts a sibling reference chain through %s',
    (path) => {
      const schema = object({
        a: bool(),
        b: ref(path),
        c: array().when('a', {
          is: true,
          then: (s) =>
            s.when('b', { is: true, then: (nested) => nested.compact() }),
        }),
        d:
          path === 'd'
            ? bool().default(true)
            : object({ enabled: bool().default(true) }),
      });
      const result = schema.cast({ a: true, c: [''] });
      expect(result.b).toBe(true);
      expect(result.c).toEqual([]);
    },
  );

  it('respects an excluded dynamic dependency', () => {
    const schema = object().shape(
      {
        a: bool(),
        b: bool(),
        c: array().when('a', {
          is: true,
          then: (s) =>
            s.when('b', { is: true, then: (nested) => nested.compact() }),
        }),
      },
      [['c', 'b']],
    );
    expect(schema.cast({ a: true, b: true, c: [''] }).c).toEqual(['']);
  });

  it('removes the cast resolver when a condition throws', () => {
    let parent: unknown;
    let bCalls = 0;
    const schema = object({
      a: bool(),
      b: number().transform((v) => {
        bCalls++;
        return v;
      }),
      c: array().when('a', (_, _s, options) => {
        parent = options.parent;
        throw new Error('condition failed');
      }),
    });
    expect(() => schema.cast({ a: true, b: 1, c: [] })).toThrowError(
      'condition failed',
    );
    array()
      .when('b', (_, s) => s)
      .resolve({ parent });
    expect(bCalls).toBe(0);
  });

  it.each([new Error('dependency failed'), undefined])(
    'does not retry a caught dependency failure (%s)',
    (failure) => {
      let calls = 0;
      const schema = object({
        a: bool(),
        b: string().transform(() => {
          calls++;
          if (calls === 1) throw failure;
          return 'retried-and-accepted';
        }),
        c: array().when('a', (_, s, options) => {
          try {
            array()
              .when('b', (__, nested) => nested)
              .cast([], {
                parent: options.parent,
              });
          } catch (_error) {
            // A caught lookup must not make the object's failed cast succeed.
          }
          return s;
        }),
      });
      let threw = false;
      try {
        schema.cast({ a: true, b: 'input', c: [] });
      } catch (error) {
        threw = true;
        expect(error).toBe(failure);
      }
      expect(threw).toBe(true);
      expect(calls).toBe(1);
    },
  );
});
