'use strict';
/*global describe, it */
var chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , Promise = require('promise/src/es6-extensions')
  , {
      mixed, string, date, number
    , bool, array, object, ref, lazy, reach
  } = require('../src');

chai.use(chaiAsPromised);
chai.should();


describe('Object types', function(){

  describe('casting', ()=> {
    it ('should parse json strings', () => {
      object({ hello: number() })
        .cast('{ \"hello\": \"5\" }')
        .should.eql({
          hello: 5
        })
    })

    it ('should return null for failed casts', () => {
      chai.expect(
        object().cast('dfhdfh')).to.equal(null)
    })

    it ('should recursively cast fields', () => {
      var obj = {
        num: '5',
        str: 'hello',
        arr: ['4', 5, false],
        dte: '2014-09-23T19:25:25Z',
        nested: { str: 5 },
        arrNested: [{ num: 5 }, { num: '5' }]
      }

      object({
        num: number(),
        str: string(),
        arr: array().of(number()),
        dte: date(),
        nested: object().shape({ str: string() }),
        arrNested: array().of(
          object().shape({ num: number() })
        )
      })
      .cast(obj).should.eql({
        num: 5,
        str: 'hello',
        arr: [4, 5, 0],
        dte: new Date(1411500325000),
        nested: { str: '5' },
        arrNested: [{ num: 5 }, { num: 5 }]
      })
    })
  })

  describe('validation', () => {
    var inst, obj;

    beforeEach(() => {
      inst = object().shape({
        num: number().max(4),
        str: string(),
        arr: array().of(number().max(6)),
        dte: date(),
        nested: object().shape({ str: string().min(3) }).required(),
        arrNested: array().of(object().shape({ num: number() }))
      })
      obj = {
        num: '4',
        str: 'hello',
        arr: ['4', 5, false],
        dte: '2014-09-23T19:25:25Z',
        nested: { str: 5 },
        arrNested: [{ num: 5 }, { num: '2' }]
      }
    })

    it ('should run validations recursively', async () => {
      let error = await inst.validate(obj).should.be.rejected;

      error.errors.length.should.equal(1)
      error.errors[0].should.contain('nested.str')

      obj.arr[1] = 8
      obj.nested.str = '123'

      await inst.isValid().should.eventually.equal(true),

      error = await inst.validate(obj).should.be.rejected
      error.errors[0].should.contain('arr[1]')
    })

    it('should prevent recursive casting', async () => {
      let castSpy = sinon.spy(string.prototype, '_cast');

      inst = object({
        field: string()
      })

      let value = await inst.validate({ field: 5 })

      value.field.should.equal('5')

      castSpy.should.have.been.calledOnce

      string.prototype._cast.restore()
    })

    it('should respect strict for nested values', async () => {
      inst = object({
        field: string()
      })
      .strict()

      let err = await inst.validate({ field: 5 }).should.be.rejected

      err.message.should.match(/must be a `string` type/)
    })

    it('should respect child schema with strict()', async () => {
      inst = object({
        field: number().strict()
      })

      let err = await inst.validate({ field: '5' }).should.be.rejected

      err.message.should.match(/must be a `number` type/)

      inst.cast({ field: '5' }).should.eql({ field: 5 })

      err = await object({
        port: number()
          .strict()
          .integer()
      })
      .validate({ port: 'asdad' })
      .should.be.rejected
    })

    it('should handle custom validation', async function(){
      var inst = object().shape({
        prop: mixed(),
        other: mixed()
      })
      .test('test', '${path} oops', () => false)

      let err = await inst.validate({}).should.be.rejected

      err.errors[0].should.equal('this oops')
    })

    it('should not clone during validating', async function() {
      let base = mixed.prototype.clone;

      mixed.prototype.clone = function(...args) {
        if (!this._mutate)
          throw new Error('should not call clone')

        return base.apply(this, args)
      }

      try {
        await inst.validate({
          nested: { str: 'jimmm' },
          arrNested: [{ num: 5 }, { num: '2' }]
        })
        await inst.validate({
          nested: { str: 5 },
          arrNested: [{ num: 5 }, { num: '2' }]
        })
      }
      catch (err) {} //eslint-disable-line
      finally {
        mixed.prototype.clone = base
      }
    })


  })


  it('should pass options to children', function() {
    object({
      names: object({
        first: string()
      })
    })
    .cast({
        extra: true,
        names: { first: 'john', extra: true }
      }, { stripUnknown: true }
    )
    .should.eql({
      names: {
        first: 'john'
      }
    })
  })

  it('should call shape with constructed with an arg', function(){
    var inst = object({
          prop: mixed()
        })

    inst.should.have.deep.property('fields.prop')
  })

  describe('object defaults', () => {
    let objSchema;

    beforeEach(() => {
      objSchema = object({
        nest: object({
          str: string().default('hi')
        })
      })
    })

    it ('should expand objects by default', () => {
      objSchema.default().should.eql({
        nest: { str: 'hi' }
      })
    })

    it ('should accept a user provided default', () => {
      objSchema = objSchema.default({ boom: 'hi'})

      objSchema.default().should.eql({
        boom: 'hi'
      })
    })

    it ('should add empty keys when sub schema has no default', () => {
      object({
        str: string(),
        nest: object({ str: string() })
      })
      .default()
      .should.eql({
        nest: { str: undefined },
        str: undefined
      })
    })

    it ('should create defaults for missing object fields', () => {

      object({
        prop: mixed(),
        other: object({
          x: object({ b: string() })
        })
      })
      .cast({ prop: 'foo' })
      .should.eql({
        prop: 'foo',
        other: { x: { b: undefined } }
      })
    })
  })

  it('should handle empty keys', function(){
    var inst = object().shape({
      prop: mixed()
    })

    return Promise.all([

      inst.isValid({}).should.eventually.equal(true),

      inst.shape({ prop: mixed().required() })
        .isValid({}).should.eventually.equal(false)
    ])
  })

  it('should work with noUnknown', function(){
    var inst = object().shape({
          prop: mixed(),
          other: mixed()
        })

    return Promise.all([
      inst
        .noUnknown('hi')
        .validate({ extra: 'field' }, { strict: true }).should.be.rejected
          .then(function(err){
            err.errors[0].should.equal('hi')
          }),

      inst
        .noUnknown()
        .validate({ extra: 'field' }, { strict: true }).should.be.rejected
          .then(function(err){
            err.errors[0].should.be.a('string')
          })
    ])
  })

  it('should strip specific fields', function(){
    var inst = object().shape({
          prop: mixed().strip(false),
          other: mixed().strip()
        })

    inst.cast({ other: 'boo', prop: 'bar'})
      .should.eql({
        prop: 'bar'
      })
  })



  it('should allow refs', async function() {
    var schema = object({
      quz: ref('baz'),
      baz: ref('foo.bar'),
      foo: object({
        bar: string()
      }),
      x: ref('$x')
    })

    let value = await schema.validate({
      foo: { bar: 'boom' }
    }, { context: { x: 5 } })

    //console.log(value)
    value.should.eql({
      foo: {
        bar: 'boom'
      },
      baz: 'boom',
      quz: 'boom',
      x: 5
    })


  })

  describe('lazy evaluation', () => {
    let types = {
      'string': string(),
      'number': number()
    }

    it('should be cast-able', () => {
      let inst = lazy(()=> number())

      inst.cast.should.be.a('function')
      inst.cast('4').should.equal(4)
    })

    it('should be validatable', async () => {
      let inst = lazy(()=> string().trim('trim me!').strict())

      inst.validate.should.be.a('function')

      try {
        await inst.validate('  john  ')
      }
      catch (err) {
        err.message.should.equal('trim me!')
      }
    })

    it('should resolve to schema', () => {
      let inst = object({
        nested: lazy(()=> inst),
        x: object({
          y: lazy(()=> inst)
        })
      })

      reach(inst, 'nested').should.equal(inst)
      reach(inst, 'x.y').should.equal(inst)
    })

    it('should be passed the value', (done) => {
      let inst = object({
        nested: lazy(value => {
          value.should.equal('foo')
          done()
        })
      })

      inst.cast({ nested: 'foo' })
    })

    it('should be passed the options', (done) => {
      let opts = {}
      let inst = lazy((_, options) => {
        options.should.equal(opts)
        done()
      })

      inst.cast({ nested: 'foo' }, opts)
    })

    it('should always return a schema', () => {
      (() => lazy(() => {}).cast())
        .should.throw(/must return a valid schema/)
    })

    it('should set the correct path', async () => {
      let inst = object({
        str: string().required().nullable(),
        nested: lazy(() => inst.default(undefined))
      })

      let value = {
        nested: { str: null },
        str: 'foo'
      }

      try {
        await inst.validate(value, { strict: true })
      }
      catch (err) {
        err.path.should.equal('nested.str')
        err.message.should.match(/required/)
      }
    })

    it('should resolve array sub types', async () => {
      let inst = object({
        str: string().required().nullable(),
        nested: array().of(
          lazy(() => inst.default(undefined))
        )
      })

      let value = {
        nested: [{ str: null }],
        str: 'foo'
      }

      try {
        await inst.validate(value, { strict: true })
      }
      catch (err) {
        err.path.should.equal('nested[0].str')
        err.message.should.match(/required/)
      }
    })

    it('should resolve for each array item', async () => {
      let inst = array()
        .of(lazy(value => types[typeof value]))

      let val = await inst.validate(['john', 4], { strict: true })

      val.should.eql(['john', 4])
    })
  })


  it('should respect abortEarly', function(){
    var inst = object({
        nest: object({
          str: string().required()
        })
        .test('name', 'oops', function(){ return false })
    })

    return Promise.all([
      inst
        .validate({ nest: { str: null } }).should.be.rejected
        .then(function(err) {
          err.value.should.eql({ nest: { str: '' }  })
          err.errors.length.should.equal(1)
          err.errors.should.eql(['oops'])

          err.path.should.equal('nest')
        }),

      inst
        .validate({ nest: { str: null } }, { abortEarly: false }).should.be.rejected
        .then(function(err) {
          err.value.should.eql({ nest: { str: '' } })
          err.errors.length.should.equal(2)
          err.errors.should.eql(['nest.str is a required field', 'oops'])
        })
    ])
  })

  it('should sort errors by insertion order', async () => {
    var inst = object({
      foo: string().test('foo', function() {
        return new Promise(resolve => setTimeout(() => resolve(false), 10))
      }),
      bar: string().required()
    })

    let err = await inst.validate(
      { foo: 'foo', bar: null },
      { abortEarly: false }).should.rejected;

    err.errors.should.eql([
      'foo is invalid',
      'bar is a required field'
    ])
  })

  it('should respect recursive', function(){
    var inst = object({
        nest: object({
          str: string().required()
        })
      })
      .test('name', 'oops', function(){ return false })

    var val = { nest: { str: null } };

    return Promise.all([
      inst
      .validate(val, { abortEarly: false }).should.be.rejected
      .then(function(err){
        err.errors.length.should.equal(2)
      }),

      inst
        .validate(val, { abortEarly: false, recursive: false }).should.be.rejected
        .then(function(err){
          err.errors.length.should.equal(1)
          err.errors.should.eql(['oops'])
        })
    ])

  })

  it('should alias or move keys', function(){
    var inst = object().shape({
          myProp: mixed(),
          Other: mixed()
        })
        .from('prop', 'myProp')
        .from('other', 'Other', true)

    inst.cast({ prop: 5, other: 6})
      .should.eql({ myProp: 5, other: 6, Other: 6 })
  })

  it('should not move keys when it does not exist', function(){
    var inst = object().shape({
          myProp: mixed()
        })
        .from('prop', 'myProp')

    inst.cast({ myProp: 5 })
      .should.eql({ myProp: 5 })

    inst.cast({ myProp: 5, prop: 7 })
      .should.eql({ myProp: 7 })
  })

  it('should handle conditionals', function(){
    var inst = object().shape({
          noteDate: number()
            .when('stats.isBig', { is: true, then: number().min(5) })
            .when('other', function(v){
              if (v === 4) return this.max(6)
            }),
          stats: object({ isBig: bool() }),
          other: number().min(1).when('stats', { is: 5, then: number() })
        })

    return Promise.all([
      inst.isValid({ stats: { isBig: true }, rand: 5, noteDate: 7, other: 4 }).should.eventually.equal(false),
      inst.isValid({ stats: { isBig: true }, noteDate: 1, other: 4 }).should.eventually.equal(false),

      inst.isValid({ stats: { isBig: true }, noteDate: 7, other: 6 }).should.eventually.equal(true),
      inst.isValid({ stats: { isBig: true }, noteDate: 7, other: 4 }).should.eventually.equal(false),

      inst.isValid({ stats: { isBig: false }, noteDate: 4, other: 4 }).should.eventually.equal(true),

      inst.isValid({ stats: { isBig: true }, noteDate: 1, other: 4 }).should.eventually.equal(false),
      inst.isValid({ stats: { isBig: true }, noteDate: 6, other: 4 }).should.eventually.equal(true)
    ])
  })

  it('should allow opt out of topo sort on specific edges', function(){
    !(function() {
      object().shape({
          orgID: number()
            .when('location', function(v){ if (v == null) return this.required() }),
          location: string()
            .when('orgID', function(v){ if (v == null) return this.required() })
        })
    }).should.throw('Cyclic dependency: "location"')

    !(function() {
      object().shape({
          orgID: number()
            .when('location', function(v){ if (v == null) return this.required() }),
          location: string()
            .when('orgID', function(v){ if (v == null) return this.required() })
        }, [ ['location', 'orgID'] ])
    }).should.not.throw()
  })

  it('should use correct default when concating', function(){
    var inst = object().shape({
          other: bool()
        })
        .default(undefined)

    chai.expect(inst.concat(object()).default()).to.equal(undefined)

    chai.expect(inst.concat(object().default({})).default()).to.eql({})
  })

  it('should handle nested conditionals', function(){
    var countSchema = number().when('isBig', { is: true, then: number().min(5) })
      , inst = object().shape({
          other: bool(),
          stats: object({
              isBig: bool(),
              count: countSchema
            })
            .default(undefined)
            .when('other', { is: true, then: object().required() })
        })

    return Promise.all([
      inst.validate({ stats: undefined, other: true }).should.be.rejected
        .then(function(err){
          err.errors[0].should.contain('required')
        }),

      inst.validate({ stats: { isBig: true, count: 3 }, other: true }).should.be.rejected
        .then(function(err){
          err.errors[0].should.contain('must be greater than or equal to 5')
        }),

      inst.validate({ stats: { isBig: true, count: 10 }, other: true }).should.be.fulfilled
        .then(function(value){
          value.should.deep.equal({ stats: { isBig: true, count: 10 }, other: true })
        }),

      countSchema.validate(10, { context: { isBig: true } }).should.be.fulfilled
        .then(function(value){
          value.should.deep.equal(10)
        })
    ])
  })

  it('should camelCase keys', function(){
    var inst = object().shape({
          conStat: number(),
          caseStatus: number(),
          hiJohn: number()
        })
        .camelcase()

    inst.cast({ CON_STAT: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ conStat: 5, caseStatus: 6, hiJohn: 4 })

    chai.expect(inst
      .nullable()
      .cast(null)).to.equal(null)
  })

  it('should camelCase with leading underscore', function(){
    var inst = object().camelcase()

    inst
      .cast({ CON_STAT: 5, __isNew: true, __IS_FUN: true })
      .should
      .eql({ conStat: 5, __isNew: true, __isFun: true })
  })

  it('should CONSTANT_CASE keys', function(){
    var inst = object().shape({
          CON_STAT: number(),
          CASE_STATUS: number(),
          HI_JOHN: number()
        })
        .constantcase()

    inst.cast({ conStat: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ CON_STAT: 5, CASE_STATUS: 6, HI_JOHN: 4 })

    chai.expect(inst
      .nullable()
      .cast(null)).to.equal(null)
  })


})
