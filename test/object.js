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
import { expect } from 'chai';

describe('Object types', () => {
  describe('casting', () => {
    let inst;

    beforeEach(() => {
      inst = object({
        num: number(),
        str: string(),
        arr: array().of(number()),
        dte: date(),
        nested: object().shape({ str: string() }),
        arrNested: array().of(object().shape({ num: number() })),
        stripped: string().strip(),
      });
    });

    it('should parse json strings', () => {
      object({ hello: number() }).cast('{ "hello": "5" }').should.eql({
        hello: 5,
      });
    });

    it('should return null for failed casts', () => {
      expect(object().cast('dfhdfh', { assert: false })).to.equal(null);
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

      cast.should.eql({
        num: 5,
        str: 'hello',
        arr: [4, 5],
        dte: new Date(1411500325000),
        nested: { str: '5' },
        arrNested: [{ num: 5 }, { num: 5 }],
      });

      cast.arrNested[0].should.equal(obj.arrNested[0], 'should be kept as is');
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

      inst.cast(obj).should.equal(obj);
    });
  });

  describe('validation', () => {
    let inst, obj;

    beforeEach(() => {
      inst = object().shape({
        num: number().max(4),
        str: string(),
        arr: array().of(number().max(6)),
        dte: date(),
        nested: object()
          .shape({ str: string().min(3) })
          .required(),
        arrNested: array().of(object().shape({ num: number() })),
      });
      obj = {
        num: '4',
        str: 'hello',
        arr: ['4', 5, 6],
        dte: '2014-09-23T19:25:25Z',
        nested: { str: 5 },
        arrNested: [{ num: 5 }, { num: '2' }],
      };
    });

    it('should run validations recursively', async () => {
      await inst.isValid().should.eventually().equal(true);

      let error = await inst.validate(obj).should.be.rejected();

      error.errors.length.should.equal(1);
      error.errors[0].should.contain('nested.str');

      obj.nested.str = 'hello';
      obj.arr[1] = 8;

      error = await inst.validate(obj).should.be.rejected();
      error.errors[0].should.contain('arr[1]');
    });

    it('should prevent recursive casting', async () => {
      let castSpy = sinon.spy(StringSchema.prototype, '_cast');

      inst = object({
        field: string(),
      });

      let value = await inst.validate({ field: 5 });

      value.field.should.equal('5');

      castSpy.should.have.been.calledOnce();

      StringSchema.prototype._cast.restore();
    });

    it('should respect strict for nested values', async () => {
      inst = object({
        field: string(),
      }).strict();

      let err = await inst.validate({ field: 5 }).should.be.rejected();

      err.message.should.match(/must be a `string` type/);
    });

    it('should respect strict for nested object values', async () => {
      inst = object({
        obj: object({
          field: string().strict(),
        }),
      });

      let err = await inst.validate({ obj: { field: 5 } }).should.be.rejected();

      err.message.should.match(/must be a `string` type/);
    });

    it('should respect child schema with strict()', async () => {
      inst = object({
        field: number().strict(),
      });

      let err = await inst.validate({ field: '5' }).should.be.rejected();

      err.message.should.match(/must be a `number` type/);

      inst.cast({ field: '5' }).should.eql({ field: 5 });

      err = await object({
        port: number().strict().integer(),
      })
        .validate({ port: 'asdad' })
        .should.be.rejected();
    });

    it('should handle custom validation', async () => {
      let inst = object()
        .shape({
          prop: mixed(),
          other: mixed(),
        })
        .test('test', '${path} oops', () => false);

      let err = await inst.validate({}).should.be.rejected();

      err.errors[0].should.equal('this oops');
    });

    it('should not clone during validating', async function () {
      let base = MixedSchema.prototype.clone;

      MixedSchema.prototype.clone = function (...args) {
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
    object({
      names: object({
        first: string(),
      }),
    })
      .cast(
        {
          extra: true,
          names: { first: 'john', extra: true },
        },
        { stripUnknown: true },
      )
      .should.eql({
        names: {
          first: 'john',
        },
      });
  });

  it('should call shape with constructed with an arg', () => {
    let inst = object({
      prop: mixed(),
    });

    expect(inst.fields.prop).to.exist();
  });

  describe('object defaults', () => {
    let objSchema;

    beforeEach(() => {
      objSchema = object({
        nest: object({
          str: string().default('hi'),
        }),
      });
    });

    it('should expand objects by default', () => {
      objSchema.getDefault().should.eql({
        nest: { str: 'hi' },
      });
    });

    it('should accept a user provided default', () => {
      objSchema = objSchema.default({ boom: 'hi' });

      objSchema.getDefault().should.eql({
        boom: 'hi',
      });
    });

    it('should add empty keys when sub schema has no default', () => {
      object({
        str: string(),
        nest: object({ str: string() }),
      })
        .getDefault()
        .should.eql({
          nest: { str: undefined },
          str: undefined,
        });
    });

    it('should create defaults for missing object fields', () => {
      object({
        prop: mixed(),
        other: object({
          x: object({ b: string() }),
        }),
      })
        .cast({ prop: 'foo' })
        .should.eql({
          prop: 'foo',
          other: { x: { b: undefined } },
        });
    });
  });

  it('should handle empty keys', () => {
    let inst = object().shape({
      prop: mixed(),
    });

    return Promise.all([
      inst.isValid({}).should.eventually().equal(true),

      inst
        .shape({ prop: mixed().required() })
        .isValid({})
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should work with noUnknown', () => {
    let inst = object().shape({
      prop: mixed(),
      other: mixed(),
    });

    return Promise.all([
      inst
        .noUnknown('hi')
        .validate({ extra: 'field' }, { strict: true })
        .should.be.rejected()
        .then((err) => {
          err.errors[0].should.equal('hi');
        }),

      inst
        .noUnknown()
        .validate({ extra: 'field' }, { strict: true })
        .should.be.rejected()
        .then((err) => {
          err.errors[0].should.be.a('string').that.include('extra');
        }),
    ]);
  });

  it('should work with noUnknown override', async () => {
    let inst = object()
      .shape({
        prop: mixed(),
      })
      .noUnknown()
      .noUnknown(false);

    await inst.validate({ extra: 'field' }).should.become({ extra: 'field' });
  });

  it('should strip specific fields', () => {
    let inst = object().shape({
      prop: mixed().strip(false),
      other: mixed().strip(),
    });

    inst.cast({ other: 'boo', prop: 'bar' }).should.eql({
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

    inst.cast({ other: true, prop: 'bar' }).should.eql({
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
    value.should.eql({
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

    let actual = await schema
      .validate(
        {
          field: 'test',
        },
        { abortEarly: false },
      )
      .should.not.be.rejected();

    actual.should.eql({ field: 'test', dupField: 'test' });
  });

  describe('lazy evaluation', () => {
    let types = {
      string: string(),
      number: number(),
    };

    it('should be cast-able', () => {
      let inst = lazy(() => number());

      inst.cast.should.be.a('function');
      inst.cast('4').should.equal(4);
    });

    it('should be validatable', async () => {
      let inst = lazy(() => string().trim('trim me!').strict());

      inst.validate.should.be.a('function');

      try {
        await inst.validate('  john  ');
      } catch (err) {
        err.message.should.equal('trim me!');
      }
    });

    it('should resolve to schema', () => {
      let inst = object({
        nested: lazy(() => inst),
        x: object({
          y: lazy(() => inst),
        }),
      });

      reach(inst, 'nested').resolve({}).should.equal(inst);
      reach(inst, 'x.y').resolve({}).should.equal(inst);
    });

    it('should be passed the value', (done) => {
      let inst = object({
        nested: lazy((value) => {
          value.should.equal('foo');
          done();
          return string();
        }),
      });

      inst.cast({ nested: 'foo' });
    });

    it('should be passed the options', (done) => {
      let opts = {};
      let inst = lazy((_, options) => {
        options.should.equal(opts);
        done();
        return object();
      });

      inst.cast({ nested: 'foo' }, opts);
    });

    it('should always return a schema', () => {
      (() => lazy(() => {}).cast()).should.throw(/must return a valid schema/);
    });

    it('should set the correct path', async () => {
      let inst = object({
        str: string().required().nullable(),
        nested: lazy(() => inst.default(undefined)),
      });

      let value = {
        nested: { str: null },
        str: 'foo',
      };

      try {
        await inst.validate(value, { strict: true });
      } catch (err) {
        err.path.should.equal('nested.str');
        err.message.should.match(/required/);
      }
    });

    it('should set the correct path with dotted keys', async () => {
      let inst = object({
        'dotted.str': string().required().nullable(),
        nested: lazy(() => inst.default(undefined)),
      });

      let value = {
        nested: { 'dotted.str': null },
        'dotted.str': 'foo',
      };

      try {
        await inst.validate(value, { strict: true });
      } catch (err) {
        err.path.should.equal('nested["dotted.str"]');
        err.message.should.match(/required/);
      }
    });

    it('should resolve array sub types', async () => {
      let inst = object({
        str: string().required().nullable(),
        nested: array().of(lazy(() => inst.default(undefined))),
      });

      let value = {
        nested: [{ str: null }],
        str: 'foo',
      };

      try {
        await inst.validate(value, { strict: true });
      } catch (err) {
        err.path.should.equal('nested[0].str');
        err.message.should.match(/required/);
      }
    });

    it('should resolve for each array item', async () => {
      let inst = array().of(lazy((value) => types[typeof value]));

      let val = await inst.validate(['john', 4], { strict: true });

      val.should.eql(['john', 4]);
    });
  });

  it('should respect abortEarly', () => {
    let inst = object({
      nest: object({
        str: string().required(),
      }).test('name', 'oops', () => false),
    });

    return Promise.all([
      inst
        .validate({ nest: { str: '' } })
        .should.be.rejected()
        .then((err) => {
          err.value.should.eql({ nest: { str: '' } });
          err.errors.length.should.equal(1);
          err.errors.should.eql(['oops']);

          err.path.should.equal('nest');
        }),

      inst
        .validate({ nest: { str: '' } }, { abortEarly: false })
        .should.be.rejected()
        .then((err) => {
          err.value.should.eql({ nest: { str: '' } });
          err.errors.length.should.equal(2);
          err.errors.should.eql(['nest.str is a required field', 'oops']);
        }),
    ]);
  });

  it('should sort errors by insertion order', async () => {
    let inst = object({
      // use `when` to make sure it is validated second
      foo: string().when('bar', () => string().min(5)),
      bar: string().required(),
    });

    let err = await inst
      .validate({ foo: 'foo' }, { abortEarly: false })
      .should.rejected();

    err.errors.should.eql([
      'foo must be at least 5 characters',
      'bar is a required field',
    ]);
  });

  it('should respect recursive', () => {
    let inst = object({
      nest: object({
        str: string().required(),
      }),
    }).test('name', 'oops', () => false);

    let val = { nest: { str: null } };

    return Promise.all([
      inst
        .validate(val, { abortEarly: false })
        .should.be.rejected()
        .then((err) => {
          err.errors.length.should.equal(2);
        }),

      inst
        .validate(val, { abortEarly: false, recursive: false })
        .should.be.rejected()
        .then((err) => {
          err.errors.length.should.equal(1);
          err.errors.should.eql(['oops']);
        }),
    ]);
  });

  it('should alias or move keys', () => {
    let inst = object()
      .shape({
        myProp: mixed(),
        Other: mixed(),
      })
      .from('prop', 'myProp')
      .from('other', 'Other', true);

    inst
      .cast({ prop: 5, other: 6 })
      .should.eql({ myProp: 5, other: 6, Other: 6 });
  });

  it('should alias nested keys', () => {
    let inst = object({
      foo: object({
        bar: string(),
      }),
    }).from('foo.bar', 'foobar', true);

    inst
      .cast({ foo: { bar: 'quz' } })
      .should.eql({ foobar: 'quz', foo: { bar: 'quz' } });
  });

  it('should not move keys when it does not exist', () => {
    let inst = object()
      .shape({
        myProp: mixed(),
      })
      .from('prop', 'myProp');

    inst.cast({ myProp: 5 }).should.eql({ myProp: 5 });

    inst.cast({ myProp: 5, prop: 7 }).should.eql({ myProp: 7 });
  });

  it('should handle conditionals', () => {
    let inst = object().shape({
      noteDate: number()
        .when('stats.isBig', { is: true, then: number().min(5) })
        .when('other', function (v) {
          if (v === 4) return this.max(6);
        }),
      stats: object({ isBig: bool() }),
      other: number().min(1).when('stats', { is: 5, then: number() }),
    });

    return Promise.all([
      inst
        .isValid({ stats: { isBig: true }, rand: 5, noteDate: 7, other: 4 })
        .should.eventually()
        .equal(false),
      inst
        .isValid({ stats: { isBig: true }, noteDate: 1, other: 4 })
        .should.eventually()
        .equal(false),

      inst
        .isValid({ stats: { isBig: true }, noteDate: 7, other: 6 })
        .should.eventually()
        .equal(true),
      inst
        .isValid({ stats: { isBig: true }, noteDate: 7, other: 4 })
        .should.eventually()
        .equal(false),

      inst
        .isValid({ stats: { isBig: false }, noteDate: 4, other: 4 })
        .should.eventually()
        .equal(true),

      inst
        .isValid({ stats: { isBig: true }, noteDate: 1, other: 4 })
        .should.eventually()
        .equal(false),
      inst
        .isValid({ stats: { isBig: true }, noteDate: 6, other: 4 })
        .should.eventually()
        .equal(true),
    ]);
  });

  it('should handle conditionals with unknown dependencies', () => {
    let inst = object().shape({
      value: number().when('isRequired', {
        is: true,
        then: number().required(),
      }),
    });

    return Promise.all([
      inst
        .isValid({
          isRequired: true,
          value: 1234,
        })
        .should.eventually.equal(true),
      inst
        .isValid({
          isRequired: true,
        })
        .should.eventually.equal(false),

      inst
        .isValid({
          isRequired: false,
          value: 1234,
        })
        .should.eventually.equal(true),
      inst
        .isValid({
          value: 1234,
        })
        .should.eventually.equal(true),
    ]);
  });

  it('should handle conditionals synchronously', () => {
    let inst = object().shape({
      knownDependency: bool(),
      value: number().when(['unknownDependency', 'knownDependency'], {
        is: true,
        then: number().required(),
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
    ).to.throw(/required/);
  });

  it('should allow opt out of topo sort on specific edges', () => {
    expect(() => {
      object().shape({
        orgID: number().when('location', function (v) {
          if (v == null) return this.required();
        }),
        location: string().when('orgID', function (v) {
          if (v == null) return this.required();
        }),
      });
    }).to.throw('Cyclic dependency, node was:"location"');

    expect(() => {
      object().shape(
        {
          orgID: number().when('location', function (v) {
            if (v == null) return this.required();
          }),
          location: string().when('orgID', function (v) {
            if (v == null) return this.required();
          }),
        },
        [['location', 'orgID']],
      );
    }).not.to.throw();
  });

  it('should use correct default when concating', () => {
    let inst = object({
      other: bool(),
    }).default(undefined);

    expect(inst.concat(object()).getDefault()).to.equal(undefined);

    expect(inst.concat(object().default({})).getDefault()).to.eql({});
  });

  it('should maintain excluded edges when concating', async () => {
    const schema = object().shape(
      {
        a1: string().when('a2', {
          is: undefined,
          then: string().required(),
        }),
        a2: string().when('a1', {
          is: undefined,
          then: string().required(),
        }),
      },
      [['a1', 'a2']],
    );

    await expect(schema.concat(object()).isValid({ a1: null })).to.become(
      false,
    );
  });

  it('should handle nested conditionals', () => {
    let countSchema = number().when('isBig', {
      is: true,
      then: number().min(5),
    });
    let inst = object({
      other: bool(),
      stats: object({
        isBig: bool(),
        count: countSchema,
      })
        .default(undefined)
        .when('other', { is: true, then: object().required() }),
    });

    return Promise.all([
      inst
        .validate({ stats: undefined, other: true })
        .should.be.rejected()
        .then((err) => {
          err.errors[0].should.contain('required');
        }),

      inst
        .validate({ stats: { isBig: true, count: 3 }, other: true })
        .should.be.rejected()
        .then((err) => {
          err.errors[0].should.contain('must be greater than or equal to 5');
        }),

      inst
        .validate({ stats: { isBig: true, count: 10 }, other: true })
        .should.be.fulfilled()
        .then((value) => {
          value.should.deep.equal({
            stats: { isBig: true, count: 10 },
            other: true,
          });
        }),

      countSchema
        .validate(10, { context: { isBig: true } })
        .should.be.fulfilled()
        .then((value) => {
          value.should.deep.equal(10);
        }),
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

    inst
      .cast({ CON_STAT: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ conStat: 5, caseStatus: 6, hiJohn: 4 });

    expect(inst.nullable().cast(null)).to.equal(null);
  });

  it('should CONSTANT_CASE keys', () => {
    let inst = object()
      .shape({
        CON_STAT: number(),
        CASE_STATUS: number(),
        HI_JOHN: number(),
      })
      .constantCase();

    inst
      .cast({ conStat: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ CON_STAT: 5, CASE_STATUS: 6, HI_JOHN: 4 });

    expect(inst.nullable().cast(null)).to.equal(null);
  });

  it('should pick', async () => {
    let inst = object({
      age: number().default(30).required(),
      name: string().default('pat').required(),
      color: string().default('red').required(),
    });

    expect(inst.pick(['age', 'name']).getDefault()).to.eql({
      age: 30,
      name: 'pat',
    });

    expect(
      await inst.pick(['age', 'name']).validate({ age: 24, name: 'Bill' }),
    ).to.eql({
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

    expect(inst.omit(['age', 'name']).getDefault()).to.eql({
      color: 'red',
    });

    expect(
      await inst.omit(['age', 'name']).validate({ color: 'mauve' }),
    ).to.eql({ color: 'mauve' });
  });

  xit('should handle invalid shapes better', async () => {
    var schema = object().shape({
      permissions: undefined,
    });

    expect(
      await schema.isValid({ permissions: [] }, { abortEarly: false }),
    ).to.equal(true);
  });
});
