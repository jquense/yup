'use strict';
/*global describe, it */
var chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , Promise = require('promise/src/es6-extensions')
  , mixed = require('../src/mixed')
  , string = require('../src/string')
  , date = require('../src/date')
  , number = require('../src/number')
  , bool = require('../src/boolean')
  , array = require('../src/array')
  , object = require('../src/object');

chai.use(chaiAsPromised);
chai.should();


describe('Object types', function(){

  it('should CAST correctly', function(){

    var inst = object()
      , obj = {
          num: '5',
          str: 'hello',
          arr: ['4', 5, false],
          dte: '2014-09-23T19:25:25Z',
          nested: { str: 5 },
          arrNested: [{ num: 5 }, { num: '5' }]
        }

    object()
      .shape({ hello: number() })
      .cast('{ \"hello\": \"5\" }').should.eql({ hello: 5 })

    chai.expect(
      object().cast('dfhdfh')).to.eql(null)

    inst = inst.shape({
        num: number(),
        str: string(),
        arr: array().of(number()),
        dte: date(),
        nested: object().shape({ str: string() }),
        arrNested: array().of(
          object().shape({ num: number() })
        )
      })
    //console.log(inst.cast(obj))

    inst.cast(obj).should.eql({
      num: 5,
      str: 'hello',
      arr: [4, 5, 0],
      dte: new Date(1411500325000),
      nested: { str: '5' },
      arrNested: [
        { num: 5 },
        { num: 5 }
      ]
    })
  })


  it('should VALIDATE correctly', function(){
    var inst
      , obj = {
          num: '4',
          str: 'hello',
          arr: ['4', 5, false],
          dte: '2014-09-23T19:25:25Z',
          nested: { str: 5 },
          arrNested: [{ num: 5 }, { num: '2' }]
        }

    inst = object().shape({
        num: number().max(4),
        str: string(),
        arr: array().of(number().max(6)),
        dte: date(),

        nested: object()
          .shape({ str: string().min(3) })
          .required(),

        arrNested: array().of(
          object().shape({ num: number() })
        )
      })

    return inst.validate(obj).should.be.rejected
      .then(function(err){
        err.errors.length.should.equal(1)
        err.errors[0].should.contain('nested.str')
      })
      .then(function(){

        obj.arr[1] = 8

        return Promise.all([
          inst.isValid().should.eventually.equal(true),

          inst.validate(obj).should.be.rejected.then(function(err){
            err.errors[0].should.contain('arr[1]')
          })
        ])
      })
  })

  it('should not clone during validating', function(){
    var inst = object().shape({
        num: number().max(4),
        str: string(),
        arr: array().of(number().max(6)),
        dte: date(),

        nested: object()
          .shape({ str: string().min(3) })
          .required(),

        arrNested: array().of(
          object().shape({ num: number() })
        )
      })

    let base = mixed.prototype.clone;
    let replace = () => mixed.prototype.clone = base
    mixed.prototype.clone = function(...args) {
      if (!this._mutate)
        throw new Error('should not call clone')

      return base.apply(this, args)
    }

    return inst
      .validate({
        nested: { str: 5 },
        arrNested: [{ num: 5 }, { num: '2' }]
      })
      .then(replace)
      .catch(replace)
  })


  it('should call shape with constructed with an arg', function(){
    var inst = object({
          prop: mixed()
        })

    inst.should.have.deep.property('fields.prop')
  })

  it('should create a reasonable default', function(){

    object({
        str: string(),
        nest: object({
          str: string().default('hi')
        })
    })
    .default().should.eql({ nest: { str: 'hi' }, str: undefined })

    object({
        str: string(),
        nest: object({ str: string().default('hi') })
    })
    .default({ boom: 'hi'})
    .default()
    .should.eql({ boom: 'hi'})


    chai.expect(object({
        str: string(),
        nest: object({ str: string() })
    })
    .default()).to.eql({ nest: { str: undefined }, str: undefined })
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
        .noUnknown('hi')

    return inst.validate({ extra: 'field' })
      .should.be.rejected
      .then(function(err){
        err.errors[0].should.equal('hi')
      })
  })

  it('should handle custom validation', function(){
    var inst = object().shape({
          prop: mixed(),
          other: mixed()
        })

    inst = inst.test('test', '${path} oops', function(){
      return false
    })

    return inst.validate({}).should.be.rejected
      .then(function(err){
        err.errors[0].should.equal('this oops')
      })
  })

  it('should allow nesting with "$this"', function(){
    var inst = object().shape({
          child: '$this',
          str: string().trim().default('yo!'),
          other: string().required('required!'),
          arr: array().of('$this')
        })

    inst.default().should.eql({
      child: undefined,
      other: undefined,
      arr: undefined,
      str: 'yo!'
    })

    return Promise.all([

      inst.validate({
        child: { other: undefined },
        other: 'ff'
      }).should.be.rejected
        .then(function(err){
          err.errors[0].should.equal('required!')
        }),

      inst.validate({
        arr: [{ other: undefined, str: '   john ' }],
        other: 'ff'
      }).should.be.rejected
        .then(function(err){
          err.value.arr[0].str.should.equal('john')
          err.errors[0].should.equal('required!')
        })
    ])
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
          err.errors.should.eql(['oops', 'nest.str is a required field'])
        })
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
          myProp: mixed(),
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
          other: bool(),
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
          err.errors[0].should.contain('must be at least 5')
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
