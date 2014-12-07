'use strict';
/*global describe, it */
var chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , Promise = require('es6-promise').Promise
  , mixed = require('../dist/mixed')
  , string = require('../dist/string')
  , date = require('../dist/date')
  , number = require('../dist/number')
  , bool = require('../dist/boolean')
  , array = require('../dist/array')
  , object = require('../dist/object');

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
      .cast("{ \"hello\": \"5\" }").should.eql({ hello: 5 })

    chai.expect(
      object().cast('dfhdfh')).to.equal(null)

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
        err.errors[0].should.contain('this.nested.str')
      })
      .then(function(){

        obj.arr[1] = 8

        return Promise.all([
          inst.isValid().should.eventually.equal(true),
          inst.validate(obj).should.be.rejected.then(function(err){
            err.errors[0].should.contain('this.arr[1]')
          })
        ])
      })
  })

  it('should call shape with constructed with an arg', function(){
    var inst = object({
          prop: mixed(),
        })

    inst.should.have.deep.property('fields.prop')
  })

  it('should create a reasonable default', function(){
    object({
        str: string(),
        nest: object({
          str: string().default('hi'),
        })
    })
    .default().should.eql({ nest: { str: 'hi' } })

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
    .default()).to.equal(undefined)
  })

  it('should handle empty keys', function(){
    var inst = object().shape({
          prop: mixed(),
        })

    return Promise.all([
      inst.isValid({}).should.eventually.equal(true),

      inst.shape({ prop: mixed().required() })
        .isValid({}).should.eventually.equal(false)
    ])
  })

  it('should handle custom validation', function(){
    var inst = object().shape({
          prop: mixed(),
          other: mixed(),
        })

    inst = inst.validation('${path} oops', function(value){
      return false
    })

    return inst.validate({}).should.be.rejected
      .then(function(err){
        err.errors[0].should.equal('this oops')
      })
  })

  it('should alias or move keys', function(){
    var inst = object().shape({
          myProp: mixed(),
          Other: mixed(),
        })
        .from('prop', 'myProp')
        .from('other', 'Other', true)

    inst.cast({ prop: 5, other: 6})
      .should.eql({ myProp: 5, other: 6, Other: 6 })
  })

  it('should handle conditionals', function(){
    var inst = object().shape({
          noteDate: number()
            .when('stats.isBig', { is: true, then: number().min(5) })
            .when('other', function(v){
              if (v === 4) return this.max(6)
            }),
          stats: object({ isBig: bool() }),
          other: number().min(1)
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

  it('should camelCase keys', function(){
    var inst = object().shape({
          conStat: number(),
          caseStatus: number(),
          hiJohn: number()
        })
        .camelcase()

    inst.cast({ CON_STAT: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ conStat: 5, caseStatus: 6, hiJohn: 4 })
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
  })


})