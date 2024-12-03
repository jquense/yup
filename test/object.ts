import {
  mixed,
  string,
  date,
  number,
  bool,
  array,
  object,
  ref,
  lazy,
  reach,
  StringSchema,
  MixedSchema,
} from '../src';
import ObjectSchema from '../src/object';
import { AnyObject } from '../src/types';
import { validationErrorWithMessages } from './helpers';

describe('Object types', () => {
  describe('casting', () => {
    let createInst = () =>
      object({
        num: number(),
        str: string(),
        arr: array().of(number()),
        dte: date(),
        nested: object().shape({ str: string() }),
        arrNested: array().of(object().shape({ num: number() })),
        stripped: string().strip(),
      });

    let inst: ReturnType<typeof createInst>;

    beforeEach(() => {
      inst = createInst();
    });

    it('should parse json strings', () => {
      expect(
        object({ hello: number() }).json().cast('{ "hello": "5" }'),
      ).toEqual({
        hello: 5,
      });
    });

    it('should return input for failed casts', () => {
      expect(object().cast('dfhdfh', { assert: false })).toBe('dfhdfh');
    });

    it('should recursively cast fields', () => {
      let obj = {
        num: '5',
        str: 'hello',
        arr: ['4', 5],
        dte: '2014-09-23T19:25:25Z',
        nested: { str: 5 },
        arrNested: [{ num: 5 }, { num: '5' }],
      };

      const cast = inst.cast(obj);

      expect(cast).toEqual({
        num: 5,
        str: 'hello',
        arr: [4, 5],
        dte: new Date(1411500325000),
        nested: { str: '5' },
        arrNested: [{ num: 5 }, { num: 5 }],
      });

      expect(cast.arrNested![0]).toBe(obj.arrNested[0]);
    });

    it('should return the same object if all props are already cast', () => {
      let obj = {
        num: 5,
        str: 'hello',
        arr: [4, 5],
        dte: new Date(1411500325000),
        nested: { str: '5' },
        arrNested: [{ num: 5 }, { num: 5 }],
      };

      expect(inst.cast(obj)).toBe(obj);
    });
  });

  describe('validation', () => {
    it('should run validations recursively', async () => {
      let inst = object({
        num: number(),
        str: string(),
        arr: array().of(number()),
        dte: date(),
        nested: object().shape({ str: string().strict() }),
        arrNested: array().of(object().shape({ num: number() })),
        stripped: string().strip(),
      });

      let obj: AnyObject = {
        num: '4',
        str: 'hello',
        arr: ['4', 5, 6],
        dte: '2014-09-23T19:25:25Z',
        nested: { str: 5 },
        arrNested: [{ num: 5 }, { num: '2' }],
      };

      await expect(inst.isValid(undefined)).resolves.toBe(true);

      await expect(inst.validate(obj)).rejects.toEqual(
        validationErrorWithMessages(expect.stringContaining('nested.str')),
      );

      obj.nested.str = 'hello';
      obj.arrNested[1] = 8;

      await expect(inst.validate(obj)).rejects.toEqual(
        validationErrorWithMessages(expect.stringContaining('arrNested[1]')),
      );
    });

    it('should prevent recursive casting', async () => {
      let castSpy = jest.spyOn(StringSchema.prototype, '_cast' as any);

      let inst = object({
        field: string(),
      });

      let value = await inst.validate({ field: 5 });

      expect(value.field).toBe('5');

      expect(castSpy).toHaveBeenCalledTimes(1);

      castSpy.mockRestore();
    });

    it('should respect strict for nested values', async () => {
      let inst = object({
        field: string(),
      }).strict();

      await expect(inst.validate({ field: 5 })).rejects.toThrowError(
        /must be a `string` type/,
      );
    });

    it('should respect strict for nested object values', async () => {
      let inst = object({
        obj: object({
          field: string().strict(),
        }),
      });

      await expect(inst.validate({ obj: { field: 5 } })).rejects.toThrowError(
        /must be a `string` type/,
      );
    });

    it('should respect child schema with strict()', async () => {
      let inst = object({
        field: number().strict(),
      });

      await expect(inst.validate({ field: '5' })).rejects.toThrowError(
        /must be a `number` type/,
      );

      expect(inst.cast({ field: '5' })).toEqual({ field: 5 });

      await expect(
        object({
          port: number().strict().integer(),
        }).validate({ port: 'asdad' }),
      ).rejects.toThrowError();
    });

    it('should handle custom validation', async () => {
      let inst = object()
        .shape({
          prop: mixed(),
          other: mixed(),
        })
        .test('test', '${path} oops', () => false);

      await expect(inst.validate({})).rejects.toThrowError('this oops');
    });

    it('should not clone during validating', async function () {
      let inst = object({
        num: number(),
        str: string(),
        arr: array().of(number()),
        dte: date(),
        nested: object().shape({ str: string() }),
        arrNested: array().of(object().shape({ num: number() })),
        stripped: string().strip(),
      });

      let base = MixedSchema.prototype.clone;

      MixedSchema.prototype.clone = function (...args) {
        // @ts-expect-error private property
        if (!this._mutate) throw new Error('should not call clone');

        return base.apply(this, args);
      };

      try {
        await inst.validate({
          nested: { str: 'jimmm' },
          arrNested: [{ num: 5 }, { num: '2' }],
        });
        await inst.validate({
          nested: { str: 5 },
          arrNested: [{ num: 5 }, { num: '2' }],
        });
      } catch (err) {
        /* ignore */
      } finally {
        //eslint-disable-line
        MixedSchema.prototype.clone = base;
      }
    });
  });

  it('should pass options to children', function () {
    expect(
      object({
        names: object({
          first: string(),
        }),
      }).cast(
        {
          extra: true,
          names: { first: 'john', extra: true },
        },
        { stripUnknown: true },
      ),
    ).toEqual({
      names: {
        first: 'john',
      },
    });
  });

  it('should call shape with constructed with an arg', () => {
    let inst = object({
      prop: mixed(),
    });

    expect(inst.fields.prop).toBeDefined();
  });

  describe('stripUnknown', () => {
    it('should remove extra fields', () => {
      const inst = object({
        str: string(),
      });

      expect(
        inst.cast(
          { str: 'hi', extra: false, sneaky: undefined },
          { stripUnknown: true },
        ),
      ).toStrictEqual({
        str: 'hi',
      });
    });

    it('should one undefined extra fields', () => {
      const inst = object({
        str: string(),
      });

      expect(
        inst.cast({ str: 'hi', sneaky: undefined }, { stripUnknown: true }),
      ).toStrictEqual({
        str: 'hi',
      });
    });
  });

  describe('object defaults', () => {
    const createSchema = () =>
      object({
        nest: object({
          str: string().default('hi'),
        }),
      });

    let objSchema: ReturnType<typeof createSchema>;

    beforeEach(() => {
      objSchema = createSchema();
    });

    it('should expand objects by default', () => {
      expect(objSchema.getDefault()).toEqual({
        nest: { str: 'hi' },
      });
    });

    it('should accept a user provided default', () => {
      let schema = objSchema.default({ boom: 'hi' });

      expect(schema.getDefault()).toEqual({
        boom: 'hi',
      });
    });

    it('should add empty keys when sub schema has no default', () => {
      expect(
        object({
          str: string(),
          nest: object({ str: string() }),
        }).getDefault(),
      ).toEqual({
        nest: { str: undefined },
        str: undefined,
      });
    });

    it('should create defaults for missing object fields', () => {
      expect(
        object({
          prop: mixed(),
          other: object({
            x: object({ b: string() }),
          }),
        }).cast({ prop: 'foo' }),
      ).toEqual({
        prop: 'foo',
        other: { x: { b: undefined } },
      });
    });

    it('should propagate context', () => {
      const objectWithConditions = object({
        child: string().when('$variable', {
          is: 'foo',
          then: (s) => s.default('is foo'),
          otherwise: (s) => s.default('not foo'),
        }),
      });

      expect(
        objectWithConditions.getDefault({ context: { variable: 'foo' } }),
      ).toEqual({ child: 'is foo' });

      expect(
        objectWithConditions.getDefault({
          context: { variable: 'somethingElse' },
        }),
      ).toEqual({ child: 'not foo' });

      expect(objectWithConditions.getDefault()).toEqual({ child: 'not foo' });
    });

    it('should respect options when casting to default', () => {
      const objectWithConditions = object({
        child: string().when('$variable', {
          is: 'foo',
          then: (s) => s.default('is foo'),
          otherwise: (s) => s.default('not foo'),
        }),
      });

      expect(
        objectWithConditions.cast(undefined, { context: { variable: 'foo' } }),
      ).toEqual({ child: 'is foo' });

      expect(
        objectWithConditions.cast(undefined, {
          context: { variable: 'somethingElse' },
        }),
      ).toEqual({ child: 'not foo' });

      expect(objectWithConditions.cast(undefined)).toEqual({
        child: 'not foo',
      });
    });
  });

  it('should handle empty keys', () => {
    let inst = object().shape({
      prop: mixed(),
    });

    return Promise.all([
      expect(inst.isValid({})).resolves.toBe(true),

      expect(
        inst.shape({ prop: mixed().required() }).isValid({}),
      ).resolves.toBe(false),
    ]);
  });

  it('should work with noUnknown', () => {
    let inst = object().shape({
      prop: mixed(),
      other: mixed(),
    });

    return Promise.all([
      expect(
        inst.noUnknown('hi').validate({ extra: 'field' }, { strict: true }),
      ).rejects.toThrowError('hi'),

      expect(
        inst.noUnknown().validate({ extra: 'field' }, { strict: true }),
      ).rejects.toThrowError(/extra/),
    ]);
  });

  it('should work with noUnknown override', async () => {
    let inst = object()
      .shape({
        prop: mixed(),
      })
      .noUnknown()
      .noUnknown(false);

    await expect(inst.validate({ extra: 'field' })).resolves.toEqual({
      extra: 'field',
    });
  });

  it('should work with exact', async () => {
    let inst = object()
      .shape({
        prop: mixed(),
      })
      .exact();

    await expect(inst.validate({ extra: 'field' })).rejects.toThrowError(
      'this object contains unknown properties: extra',
    );
  });

  it('should strip specific fields', () => {
    let inst = object().shape({
      prop: mixed().strip(false),
      other: mixed().strip(),
    });

    expect(inst.cast({ other: 'boo', prop: 'bar' })).toEqual({
      prop: 'bar',
    });
  });

  it('should handle field striping with `when`', () => {
    let inst = object().shape({
      other: bool(),
      prop: mixed().when('other', {
        is: true,
        then: (s) => s.strip(),
      }),
    });

    expect(inst.cast({ other: true, prop: 'bar' })).toEqual({
      other: true,
    });
  });

  it('should allow refs', async function () {
    let schema = object({
      quz: ref('baz'),
      baz: ref('foo.bar'),
      foo: object({
        bar: string(),
      }),
      x: ref('$x'),
    });

    let value = await schema.validate(
      {
        foo: { bar: 'boom' },
      },
      { context: { x: 5 } },
    );

    //console.log(value)
    expect(value).toEqual({
      foo: {
        bar: 'boom',
      },
      baz: 'boom',
      quz: 'boom',
      x: 5,
    });
  });

  it('should allow refs with abortEarly false', async () => {
    let schema = object().shape({
      field: string(),
      dupField: ref('field'),
    });

    await expect(
      schema.validate(
        {
          field: 'test',
        },
        { abortEarly: false },
      ),
    ).resolves.toEqual({ field: 'test', dupField: 'test' });
  });

  describe('lazy evaluation', () => {
    let types = {
      string: string(),
      number: number(),
    };

    it('should be cast-able', () => {
      let inst = lazy(() => number());

      expect(inst.cast).toBeInstanceOf(Function);
      expect(inst.cast('4')).toBe(4);
    });

    it('should be validatable', async () => {
      let inst = lazy(() => string().trim('trim me!').strict());

      expect(inst.validate).toBeInstanceOf(Function);

      try {
        await inst.validate('  john  ');
      } catch (err: any) {
        expect(err.message).toBe('trim me!');
      }
    });

    it('should resolve to schema', () => {
      type Nested = {
        nested: Nested;
        x: {
          y: Nested;
        };
      };
      let inst: ObjectSchema<Nested> = object({
        nested: lazy(() => inst),
        x: object({
          y: lazy(() => inst),
        }),
      });

      expect(reach(inst, 'nested').resolve({})).toBe(inst);
      expect(reach(inst, 'x.y').resolve({})).toBe(inst);
    });

    it('should be passed the value', (done) => {
      let inst = object({
        nested: lazy((value) => {
          expect(value).toBe('foo');
          done();
          return string();
        }),
      });

      inst.cast({ nested: 'foo' });
    });

    it('should be passed the options', (done) => {
      let opts = {};
      let inst = lazy((_, options) => {
        expect(options).toBe(opts);
        done();
        return object();
      });

      inst.cast({ nested: 'foo' }, opts);
    });

    it('should always return a schema', () => {
      // @ts-expect-error Incorrect usage
      expect(() => lazy(() => {}).cast()).toThrowError(
        /must return a valid schema/,
      );
    });

    it('should set the correct path', async () => {
      type Nested = {
        str: string | null;
        nested: Nested;
      };

      let inst: ObjectSchema<Nested> = object({
        str: string().required().nullable(),
        nested: lazy(() => inst.default(undefined)),
      });

      let value = {
        nested: { str: null },
        str: 'foo',
      };

      try {
        await inst.validate(value, { strict: true });
      } catch (err: any) {
        expect(err.path).toBe('nested.str');
        expect(err.message).toMatch(/required/);
      }
    });

    it('should set the correct path with dotted keys', async () => {
      let inst: ObjectSchema<any> = object({
        'dotted.str': string().required().nullable(),
        nested: lazy(() => inst.default(undefined)),
      });

      let value = {
        nested: { 'dotted.str': null },
        'dotted.str': 'foo',
      };

      try {
        await inst.validate(value, { strict: true });
      } catch (err: any) {
        expect(err.path).toBe('nested["dotted.str"]');
        expect(err.message).toMatch(/required/);
      }
    });

    it('should resolve array sub types', async () => {
      let inst: ObjectSchema<any> = object({
        str: string().required().nullable(),
        nested: array().of(lazy(() => inst.default(undefined))),
      });

      let value = {
        nested: [{ str: null }],
        str: 'foo',
      };

      try {
        await inst.validate(value, { strict: true });
      } catch (err: any) {
        expect(err.path).toBe('nested[0].str');
        expect(err.message).toMatch(/required/);
      }
    });

    it('should resolve for each array item', async () => {
      let inst = array().of(
        lazy((value: string | number) => (types as any)[typeof value]),
      );

      let val = await inst.validate(['john', 4], { strict: true });

      expect(val).toEqual(['john', 4]);
    });
  });

  it('should respect abortEarly', async () => {
    let inst = object({
      nest: object({
        str: string().required(),
      }).test('name', 'oops', () => false),
    });

    return Promise.all([
      expect(inst.validate({ nest: { str: '' } })).rejects.toEqual(
        expect.objectContaining({
          value: { nest: { str: '' } },
          // path: 'nest',
          errors: ['oops'],
        }),
      ),

      expect(
        inst.validate({ nest: { str: '' } }, { abortEarly: false }),
      ).rejects.toEqual(
        expect.objectContaining({
          value: { nest: { str: '' } },
          errors: ['nest.str is a required field', 'oops'],
        }),
      ),
    ]);
  });

  it('should flatten validation errors with abortEarly=false', async () => {
    let inst = object({
      str: string().required(),
      nest: object({
        innerStr: string().required(),
        num: number().moreThan(5),
        other: number().test('nested', 'invalid', () => {
          string().email().min(3).validateSync('f', { abortEarly: false });
          return true;
        }),
      }).test('name', 'oops', () => false),
    });

    const error = await inst
      .validate(
        { str: null, nest: { num: 2, str: undefined } },
        { abortEarly: false },
      )
      .catch((e) => e);

    expect(error.inner).toMatchInlineSnapshot(`
      Array [
        [ValidationError: str is a required field],
        [ValidationError: nest.innerStr is a required field],
        [ValidationError: nest.num must be greater than 5],
        [ValidationError: oops],
        [ValidationError: this must be a valid email],
        [ValidationError: this must be at least 3 characters],
      ]
    `);

    expect(error.errors).toEqual([
      'str is a required field',
      'nest.innerStr is a required field',
      'nest.num must be greater than 5',
      'oops',
      'this must be a valid email',
      'this must be at least 3 characters',
    ]);
  });

  it('should sort errors by insertion order', async () => {
    let inst = object({
      // use `when` to make sure it is validated second
      foo: string().when('bar', () => string().min(5)),
      bar: string().required(),
    });

    await expect(
      inst.validate({ foo: 'foo' }, { abortEarly: false }),
    ).rejects.toEqual(
      validationErrorWithMessages(
        'foo must be at least 5 characters',
        'bar is a required field',
      ),
    );
  });

  it('should respect recursive', () => {
    let inst = object({
      nest: object({
        str: string().required(),
      }),
    }).test('name', 'oops', () => false);

    let val = { nest: { str: null } };

    return Promise.all([
      expect(inst.validate(val, { abortEarly: false })).rejects.toEqual(
        validationErrorWithMessages(expect.any(String), expect.any(String)),
      ),

      expect(
        inst.validate(val, { abortEarly: false, recursive: false }),
      ).rejects.toEqual(validationErrorWithMessages('oops')),
    ]);
  });

  it('partial() should work', async () => {
    let inst = object({
      age: number().required(),
      name: string().required(),
    });

    await expect(inst.isValid({ age: null, name: '' })).resolves.toEqual(false);

    await expect(inst.partial().isValid({})).resolves.toEqual(true);

    await expect(inst.partial().isValid({ age: null })).resolves.toEqual(false);
    await expect(inst.partial().isValid({ name: '' })).resolves.toEqual(false);
  });

  it('deepPartial() should work', async () => {
    let inst = object({
      age: number().required(),
      name: string().required(),
      contacts: array(
        object({
          name: string().required(),
          age: number().required(),
          lazy: lazy(() => number().required()),
        }),
      ).defined(),
    });

    await expect(inst.isValid({ age: 2, name: 'fs' })).resolves.toEqual(false);
    await expect(
      inst.isValid({ age: 2, name: 'fs', contacts: [{}] }),
    ).resolves.toEqual(false);

    const instPartial = inst.deepPartial();

    await expect(
      inst.validate({ age: 1, name: 'f', contacts: [{ name: 'f', age: 1 }] }),
    ).rejects.toThrowError('contacts[0].lazy is a required field');

    await expect(instPartial.isValid({})).resolves.toEqual(true);

    await expect(instPartial.isValid({ contacts: [{}] })).resolves.toEqual(
      true,
    );

    await expect(
      instPartial.isValid({ contacts: [{ age: null }] }),
    ).resolves.toEqual(false);

    await expect(
      instPartial.isValid({ contacts: [{ lazy: null }] }),
    ).resolves.toEqual(false);
  });

  it('should alias or move keys', () => {
    let inst = object()
      .shape({
        myProp: mixed(),
        Other: mixed(),
      })
      .from('prop', 'myProp')
      .from('other', 'Other', true);

    expect(inst.cast({ prop: 5, other: 6 })).toEqual({
      myProp: 5,
      other: 6,
      Other: 6,
    });
  });

  it('should alias nested keys', () => {
    let inst = object({
      foo: object({
        bar: string(),
      }),
      // @ts-expect-error FIXME
    }).from('foo.bar', 'foobar', true);

    expect(inst.cast({ foo: { bar: 'quz' } })).toEqual({
      foobar: 'quz',
      foo: { bar: 'quz' },
    });
  });

  it('should not move keys when it does not exist', () => {
    let inst = object()
      .shape({
        myProp: mixed(),
      })
      .from('prop', 'myProp');

    expect(inst.cast({ myProp: 5 })).toEqual({ myProp: 5 });

    expect(inst.cast({ myProp: 5, prop: 7 })).toEqual({ myProp: 7 });
  });

  it('should handle conditionals', () => {
    let inst = object().shape({
      noteDate: number()
        .when('stats.isBig', {
          is: true,
          then: (s) => s.min(5),
        })
        .when('other', ([v], schema) => (v === 4 ? schema.max(6) : schema)),
      stats: object({ isBig: bool() }),
      other: number()
        .min(1)
        .when('stats', { is: 5, then: (s) => s }),
    });

    return Promise.all([
      expect(
        // other makes noteDate too large
        inst.isValid({
          stats: { isBig: true },
          rand: 5,
          noteDate: 7,
          other: 4,
        }),
      ).resolves.toBe(false),
      expect(
        inst.isValid({ stats: { isBig: true }, noteDate: 1, other: 4 }),
      ).resolves.toBe(false),

      expect(
        inst.isValid({ stats: { isBig: true }, noteDate: 7, other: 6 }),
      ).resolves.toBe(true),
      expect(
        inst.isValid({ stats: { isBig: true }, noteDate: 7, other: 4 }),
      ).resolves.toBe(false),

      expect(
        inst.isValid({ stats: { isBig: false }, noteDate: 4, other: 4 }),
      ).resolves.toBe(true),

      expect(
        inst.isValid({ stats: { isBig: true }, noteDate: 1, other: 4 }),
      ).resolves.toBe(false),
      expect(
        inst.isValid({ stats: { isBig: true }, noteDate: 6, other: 4 }),
      ).resolves.toBe(true),
    ]);
  });

  it('should handle conditionals with unknown dependencies', () => {
    let inst = object().shape({
      value: number().when('isRequired', {
        is: true,
        then: (s) => s.required(),
      }),
    });

    return Promise.all([
      expect(
        inst.isValid({
          isRequired: true,
          value: 1234,
        }),
      ).resolves.toBe(true),
      expect(
        inst.isValid({
          isRequired: true,
        }),
      ).resolves.toBe(false),

      expect(
        inst.isValid({
          isRequired: false,
          value: 1234,
        }),
      ).resolves.toBe(true),
      expect(
        inst.isValid({
          value: 1234,
        }),
      ).resolves.toBe(true),
    ]);
  });

  it('should handle conditionals synchronously', () => {
    let inst = object().shape({
      knownDependency: bool(),
      value: number().when(['unknownDependency', 'knownDependency'], {
        is: true,
        then: (s) => s.required(),
      }),
    });

    // expect(() =>
    //   inst.validateSync({
    //     unknownDependency: true,
    //     knownDependency: true,
    //     value: 1234,
    //   }),
    // ).not.throw();

    expect(() =>
      inst.validateSync({
        unknownDependency: true,
        knownDependency: true,
      }),
    ).toThrowError(/required/);
  });

  it('should allow opt out of topo sort on specific edges', () => {
    expect(() => {
      object().shape({
        orgID: number().when('location', ([v], schema) => {
          return v == null ? schema.required() : schema;
        }),
        location: string().when('orgID', (v, schema) => {
          return v == null ? schema.required() : schema;
        }),
      });
    }).toThrowError('Cyclic dependency, node was:"location"');

    expect(() => {
      object().shape(
        {
          orgID: number().when('location', ([v], schema) => {
            return v == null ? schema.required() : schema;
          }),
          location: string().when('orgID', ([v], schema) => {
            return v == null ? schema.required() : schema;
          }),
        },
        [['location', 'orgID']],
      );
    }).not.toThrowError();
  });

  it('should use correct default when concating', () => {
    let inst = object({
      other: bool(),
    }).default(undefined);

    expect(inst.concat(object()).getDefault()).toBeUndefined();

    expect(inst.concat(object().default({})).getDefault()).toEqual({});
  });

  it('should maintain excluded edges when concating', async () => {
    const schema = object().shape(
      {
        a1: string().when('a2', {
          is: undefined,
          then: (s) => s.required(),
        }),
        a2: string().when('a1', {
          is: undefined,
          then: (s) => s.required(),
        }),
      },
      [['a1', 'a2']],
    );

    await expect(
      schema.concat(object()).isValid({ a1: null }),
    ).resolves.toEqual(false);

    await expect(
      object().concat(schema).isValid({ a1: null }),
    ).resolves.toEqual(false);
  });

  it('should handle nested conditionals', () => {
    let countSchema = number().when('isBig', {
      is: true,
      then: (s) => s.min(5),
    });
    let inst = object({
      other: bool(),
      stats: object({
        isBig: bool(),
        count: countSchema,
      })
        .default(undefined)
        .when('other', { is: true, then: (s) => s.required() }),
    });

    return Promise.all([
      expect(inst.validate({ stats: undefined, other: true })).rejects.toEqual(
        validationErrorWithMessages(expect.stringContaining('required')),
      ),
      expect(
        inst.validate({ stats: { isBig: true, count: 3 }, other: true }),
      ).rejects.toEqual(
        validationErrorWithMessages(
          'stats.count must be greater than or equal to 5',
        ),
      ),
      expect(
        inst.validate({ stats: { isBig: true, count: 10 }, other: true }),
      ).resolves.toEqual({
        stats: { isBig: true, count: 10 },
        other: true,
      }),

      expect(
        countSchema.validate(10, { context: { isBig: true } }),
      ).resolves.toEqual(10),
    ]);
  });

  it('should camelCase keys', () => {
    let inst = object()
      .shape({
        conStat: number(),
        caseStatus: number(),
        hiJohn: number(),
      })
      .camelCase();

    expect(inst.cast({ CON_STAT: 5, CaseStatus: 6, 'hi john': 4 })).toEqual({
      conStat: 5,
      caseStatus: 6,
      hiJohn: 4,
    });

    expect(inst.nullable().cast(null)).toBeNull();
  });

  it('should CONSTANT_CASE keys', () => {
    let inst = object()
      .shape({
        CON_STAT: number(),
        CASE_STATUS: number(),
        HI_JOHN: number(),
      })
      .constantCase();

    expect(inst.cast({ conStat: 5, CaseStatus: 6, 'hi john': 4 })).toEqual({
      CON_STAT: 5,
      CASE_STATUS: 6,
      HI_JOHN: 4,
    });

    expect(inst.nullable().cast(null)).toBeNull();
  });

  it('should pick', async () => {
    let inst = object({
      age: number().default(30).required(),
      name: string().default('pat').required(),
      color: string().default('red').required(),
    });

    expect(inst.pick(['age', 'name']).getDefault()).toEqual({
      age: 30,
      name: 'pat',
    });

    expect(
      await inst.pick(['age', 'name']).validate({ age: 24, name: 'Bill' }),
    ).toEqual({
      age: 24,
      name: 'Bill',
    });
  });

  it('should omit', async () => {
    let inst = object({
      age: number().default(30).required(),
      name: string().default('pat').required(),
      color: string().default('red').required(),
    });

    expect(inst.omit(['age', 'name']).getDefault()).toEqual({
      color: 'red',
    });

    expect(
      await inst.omit(['age', 'name']).validate({ color: 'mauve' }),
    ).toEqual({ color: 'mauve' });
  });

  it('should pick and omit with excluded edges', async () => {
    const inst = object().shape(
      {
        a1: string().when('a2', {
          is: undefined,
          then: (schema) => schema.required(),
        }),
        a2: string().when('a1', {
          is: undefined,
          then: (schema) => schema.required(),
        }),
        a3: string().required(),
      },
      [['a1', 'a2']],
    );

    expect(
      inst.pick(['a1', 'a2']).isValid({
        a1: undefined,
        a2: 'over9000',
      }),
    ).resolves.toEqual(true);

    expect(
      inst.pick(['a1', 'a3']).isValid({
        a1: 'required',
        a3: 'asfasf',
      }),
    ).resolves.toEqual(true);

    expect(
      inst.omit(['a1', 'a2']).isValid({
        a3: 'asfasf',
      }),
    ).resolves.toEqual(true);

    expect(
      inst.omit(['a1']).isValid({
        a1: undefined,
        a3: 'asfasf',
      }),
    ).resolves.toEqual(false);
  });
});
