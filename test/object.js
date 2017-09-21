/* eslint-disable no-template-curly-in-string */
import {
  mixed, string, date, number
  , bool, array, object, ref, lazy, reach,
} from '../src';

describe('Object types', () => {
  describe('casting', () => {
    it('should parse json strings', () => {
      object({ hello: number() })
        .cast('{ "hello": "5" }')
        .should.eql({
          hello: 5,
        });
    });

    it('should return null for failed casts', () => {
      expect(
        object().cast('dfhdfh', { assert: false })).to.equal(null);
    });

    it('should recursively cast fields', () => {
      const obj = {
        num: '5',
        str: 'hello',
        arr: ['4', 5],
        dte: '2014-09-23T19:25:25Z',
        nested: { str: 5 },
        arrNested: [{ num: 5 }, { num: '5' }],
      };

      object({
        num: number(),
        str: string(),
        arr: array().of(number()),
        dte: date(),
        nested: object().shape({ str: string() }),
        arrNested: array().of(
          object().shape({ num: number() }),
        ),
      })
        .cast(obj).should.eql({
          num: 5,
          str: 'hello',
          arr: [4, 5],
          dte: new Date(1411500325000),
          nested: { str: '5' },
          arrNested: [{ num: 5 }, { num: 5 }],
        });
    });
  });

  describe('validation', () => {
    let inst;
    let obj;

    beforeEach(() => {
      inst = object().shape({
        num: number().max(4),
        str: string(),
        arr: array().of(number().max(6)),
        dte: date(),
        nested: object().shape({ str: string().min(3) }).required(),
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
      let error = await inst.validate(obj).should.be.rejected();

      error.errors.length.should.equal(1);
      error.errors[0].should.contain('nested.str');

      obj.arr[1] = 8;

      await inst.isValid().should.eventually().equal(true);

      error = await inst.validate(obj).should.be.rejected();

      error.errors[0].should.contain('arr[1]');
    });

    it('should prevent recursive casting', async () => {
      const castSpy = sinon.spy(string.prototype, '_cast');

      inst = object({
        field: string(),
      });

      const value = await inst.validate({ field: 5 });

      value.field.should.equal('5');

      castSpy.should.have.been.calledOnce();

      string.prototype._cast.restore();
    });

    it('should respect strict for nested values', async () => {
      inst = object({
        field: string(),
      })
        .strict();

      const err = await inst.validate({ field: 5 }).should.be.rejected();

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
        port: number()
          .strict()
          .integer(),
      })
        .validate({ port: 'asdad' })
        .should.be.rejected();
    });

    it('should handle custom validation', async () => {
      inst = object().shape({
        prop: mixed(),
        other: mixed(),
      })
        .test('test', '${path} oops', () => false);

      const err = await inst.validate({}).should.be.rejected();

      err.errors[0].should.equal('this oops');
    });

    it('should not clone during validating', async () => {
      const base = mixed.prototype.clone;

      mixed.prototype.clone = function clone(...args) {
        if (!this._mutate) { throw new Error('should not call clone'); }

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
      } catch (err) {} //eslint-disable-line
      finally {
        mixed.prototype.clone = base;
      }
    });
  });


  it('should pass options to children', () => {
    object({
      names: object({
        first: string(),
      }),
    })
      .cast({
        extra: true,
        names: { first: 'john', extra: true },
      }, { stripUnknown: true },
      )
      .should.eql({
        names: {
          first: 'john',
        },
      });
  });

  it('should call shape with constructed with an arg', () => {
    const inst = object({
      prop: mixed(),
    });

    inst.should.have.nested.property('fields.prop');
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
      objSchema.default().should.eql({
        nest: { str: 'hi' },
      });
    });

    it('should accept a user provided default', () => {
      objSchema = objSchema.default({ boom: 'hi' });

      objSchema.default().should.eql({
        boom: 'hi',
      });
    });

    it('should add empty keys when sub schema has no default', () => {
      object({
        str: string(),
        nest: object({ str: string() }),
      })
        .default()
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
    const inst = object().shape({
      prop: mixed(),
    });

    return Promise.all([

      inst.isValid({}).should.eventually().equal(true),

      inst.shape({ prop: mixed().required() })
        .isValid({}).should.eventually().equal(false),
    ]);
  });

  it('should work with noUnknown', () => {
    const inst = object().shape({
      prop: mixed(),
      other: mixed(),
    });

    return Promise.all([
      inst
        .noUnknown('hi')
        .validate({ extra: 'field' }, { strict: true }).should.be.rejected()
        .then((err) => {
          err.errors[0].should.equal('hi');
        }),

      inst
        .noUnknown()
        .validate({ extra: 'field' }, { strict: true }).should.be.rejected()
        .then((err) => {
          err.errors[0].should.be.a('string');
        }),
    ]);
  });

  it('should strip specific fields', () => {
    const inst = object().shape({
      prop: mixed().strip(false),
      other: mixed().strip(),
    });

    inst.cast({ other: 'boo', prop: 'bar' })
      .should.eql({
        prop: 'bar',
      });
  });

  it('should handle field striping with `when`', () => {
    const inst = object().shape({
      other: bool(),
      prop: mixed().when('other', {
        is: true,
        then: s => s.strip(),
      }),
    });

    inst.cast({ other: true, prop: 'bar' })
      .should.eql({
        other: true,
      });
  });

  it('should allow refs', async () => {
    const schema = object({
      quz: ref('baz'),
      baz: ref('foo.bar'),
      foo: object({
        bar: string(),
      }),
      x: ref('$x'),
    });

    const value = await schema.validate({
      foo: { bar: 'boom' },
    }, { context: { x: 5 } });

    // console.log(value)
    value.should.eql({
      foo: {
        bar: 'boom',
      },
      baz: 'boom',
      quz: 'boom',
      x: 5,
    });
  });

  describe('lazy evaluation', () => {
    const types = {
      string: string(),
      number: number(),
    };

    it('should be cast-able', () => {
      const inst = lazy(() => number());

      inst.cast.should.be.a('function');
      inst.cast('4').should.equal(4);
    });

    it('should be validatable', async () => {
      const inst = lazy(() => string().trim('trim me!').strict());

      inst.validate.should.be.a('function');

      try {
        await inst.validate('  john  ');
      } catch (err) {
        err.message.should.equal('trim me!');
      }
    });

    it('should resolve to schema', () => {
      const inst = object({
        nested: lazy(() => inst),
        x: object({
          y: lazy(() => inst),
        }),
      });

      reach(inst, 'nested').should.equal(inst);
      reach(inst, 'x.y').should.equal(inst);
    });

    it('should be passed the value', (done) => {
      const inst = object({
        nested: lazy((value) => {
          value.should.equal('foo');
          done();
          return string();
        }),
      });

      inst.cast({ nested: 'foo' });
    });

    it('should be passed the options', (done) => {
      const opts = {};
      const inst = lazy((_, options) => {
        options.should.equal(opts);
        done();
        return string();
      });

      inst.cast({ nested: 'foo' }, opts);
    });

    it('should always return a schema', () => {
      (() => lazy(() => {}).cast())
        .should.throw(/must return a valid schema/);
    });

    it('should set the correct path', async () => {
      const inst = object({
        str: string().required().nullable(),
        nested: lazy(() => inst.default(undefined)),
      });

      const value = {
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

    it('should resolve array sub types', async () => {
      const inst = object({
        str: string().required().nullable(),
        nested: array().of(
          lazy(() => inst.default(undefined)),
        ),
      });

      const value = {
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
      const inst = array()
        .of(lazy(value => types[typeof value]));

      const val = await inst.validate(['john', 4], { strict: true });

      val.should.eql(['john', 4]);
    });
  });


  it('should respect abortEarly', () => {
    const inst = object({
      nest: object({
        str: string().required(),
      })
        .test('name', 'oops', () => false),
    });

    return Promise.all([
      inst
        .validate({ nest: { str: '' } }).should.be.rejected()
        .then((err) => {
          err.value.should.eql({ nest: { str: '' } });
          err.errors.length.should.equal(1);
          err.errors.should.eql(['oops']);

          err.path.should.equal('nest');
        }),

      inst
        .validate(
          { nest: { str: '' } },
          { abortEarly: false },
        )
        .should.be.rejected()
        .then((err) => {
          err.value.should.eql({ nest: { str: '' } });
          err.errors.length.should.equal(2);
          err.errors.should.eql(['nest.str is a required field', 'oops']);
        }),
    ]);
  });

  it('should sort errors by insertion order', async () => {
    const inst = object({
      foo: string().test('foo', () => new Promise((resolve) => {
        setTimeout(() => resolve(false), 10);
      })),
      bar: string().required(),
    });

    const err = await inst
      .validate({ foo: 'foo' }, { abortEarly: false })
      .should.rejected();

    err.errors.should.eql([
      'foo is invalid',
      'bar is a required field',
    ]);
  });

  it('should respect recursive', () => {
    const inst = object({
      nest: object({
        str: string().required(),
      }),
    })
      .test('name', 'oops', () => false);

    const val = { nest: { str: null } };

    return Promise.all([
      inst
        .validate(val, { abortEarly: false }).should.be.rejected()
        .then((err) => {
          err.errors.length.should.equal(2);
        }),

      inst
        .validate(val, { abortEarly: false, recursive: false }).should.be.rejected()
        .then((err) => {
          err.errors.length.should.equal(1);
          err.errors.should.eql(['oops']);
        }),
    ]);
  });

  it('should alias or move keys', () => {
    const inst = object().shape({
      myProp: mixed(),
      Other: mixed(),
    })
      .from('prop', 'myProp')
      .from('other', 'Other', true);

    inst.cast({ prop: 5, other: 6 })
      .should.eql({ myProp: 5, other: 6, Other: 6 });
  });

  it('should move nested keys', () => {
    const inst = object({
      foo: object({
        bar: string(),
      }),
    })
      .from('foo.bar', 'foobar');

    inst.cast({ foo: { bar: 'quz', foof: 5 } })
      .should.eql({ foobar: 'quz', foo: { foof: 5 } });
  });

  it('should alias nested keys', () => {
    const inst = object({
      foo: object({
        bar: string(),
      }),
    })
      .from('foo.bar', 'foobar', true);

    inst.cast({ foo: { bar: 'quz' } })
      .should.eql({ foobar: 'quz', foo: { bar: 'quz' } });
  });

  it('should not move keys when it does not exist', () => {
    const inst = object().shape({
      myProp: mixed(),
    })
      .from('prop', 'myProp');

    inst.cast({ myProp: 5 })
      .should.eql({ myProp: 5 });

    inst.cast({ myProp: 5, prop: 7 })
      .should.eql({ myProp: 7 });
  });

  it('should handle conditionals', () => {
    const inst = object().shape({
      noteDate: number()
        .when('stats.isBig', { is: true, then: number().min(5) })
        .when('other', function other(v) {
          if (v === 4) return this.max(6);
          return undefined;
        }),
      stats: object({ isBig: bool() }),
      other: number().min(1).when('stats', { is: 5, then: number() }),
    });

    return Promise.all([
      inst.isValid({ stats: { isBig: true }, rand: 5, noteDate: 7, other: 4 })
        .should.eventually().equal(false),
      inst.isValid({ stats: { isBig: true }, noteDate: 1, other: 4 })
        .should.eventually().equal(false),

      inst.isValid({ stats: { isBig: true }, noteDate: 7, other: 6 })
        .should.eventually().equal(true),
      inst.isValid({ stats: { isBig: true }, noteDate: 7, other: 4 })
        .should.eventually().equal(false),

      inst.isValid({ stats: { isBig: false }, noteDate: 4, other: 4 })
        .should.eventually().equal(true),

      inst.isValid({ stats: { isBig: true }, noteDate: 1, other: 4 })
        .should.eventually().equal(false),
      inst.isValid({ stats: { isBig: true }, noteDate: 6, other: 4 })
        .should.eventually().equal(true),
    ]);
  });

  it('should allow opt out of topo sort on specific edges', () => {
    (function test() {
      object().shape({
        orgID: number()
          .when('location', function f(v) { return v == null ? this.required() : undefined; }),
        location: string()
          .when('orgID', function f(v) { return (v == null) ? this.required() : undefined; }),
      });
    }).should.throw('Cyclic dependency: "location"');

    (function test() {
      object().shape({
        orgID: number()
          .when('location', function f(v) { return (v == null) ? this.required() : undefined; }),
        location: string()
          .when('orgID', function f(v) { return (v == null) ? this.required() : undefined; }),
      }, [['location', 'orgID']]);
    }).should.not.throw();
  });

  it('should use correct default when concating', () => {
    const inst = object({
      other: bool(),
    })
      .default(undefined);

    expect(inst.concat(object()).default()).to.equal(undefined);

    expect(inst.concat(object().default({})).default()).to.eql({});
  });

  it('should handle nested conditionals', () => {
    const countSchema = number().when('isBig', { is: true, then: number().min(5) });
    const inst = object({
      other: bool(),
      stats: object({
        isBig: bool(),
        count: countSchema,
      })
        .default(undefined)
        .when('other', { is: true, then: object().required() }),
    });

    return Promise.all([
      inst.validate({ stats: undefined, other: true }).should.be.rejected()
        .then((err) => {
          err.errors[0].should.contain('required');
        }),

      inst.validate({ stats: { isBig: true, count: 3 }, other: true }).should.be.rejected()
        .then((err) => {
          err.errors[0].should.contain('must be greater than or equal to 5');
        }),

      inst.validate({ stats: { isBig: true, count: 10 }, other: true }).should.be.fulfilled()
        .then((value) => {
          value.should.deep.equal({ stats: { isBig: true, count: 10 }, other: true });
        }),

      countSchema.validate(10, { context: { isBig: true } }).should.be.fulfilled()
        .then((value) => {
          value.should.deep.equal(10);
        }),
    ]);
  });

  it('should camelCase keys', () => {
    const inst = object().shape({
      conStat: number(),
      caseStatus: number(),
      hiJohn: number(),
    })
      .camelCase();

    inst.cast({ CON_STAT: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ conStat: 5, caseStatus: 6, hiJohn: 4 });

    expect(inst
      .nullable()
      .cast(null)).to.equal(null);
  });

  // it('should camelCase with leading underscore', () => {
  //   let inst = object().camelCase()
  //
  //   inst
  //     .cast({ CON_STAT: 5, __isNew: true, __IS_FUN: true })
  //     .should
  //     .eql({ conStat: 5, __isNew: true, __isFun: true })
  // })

  it('should CONSTANT_CASE keys', () => {
    const inst = object().shape({
      CON_STAT: number(),
      CASE_STATUS: number(),
      HI_JOHN: number(),
    })
      .constantCase();

    inst.cast({ conStat: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ CON_STAT: 5, CASE_STATUS: 6, HI_JOHN: 4 });

    expect(inst
      .nullable()
      .cast(null)).to.equal(null);
  });
});
