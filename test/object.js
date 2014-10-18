'use strict';
/*global describe, it */
var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , mixed = require('../lib/mixed')
  , string = require('../lib/string')
  , date = require('../lib/date')
  , number = require('../lib/number')
  , bool = require('../lib/boolean')
  , array = require('../lib/array')
  , object = require('../lib/object');

chai.use(sinonChai);
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

    inst.isValid(obj).should.equal(false)
    inst.errors[0].should.contain('this.nested.str')

    obj.arr[1] = 8
    inst.isValid(obj).should.equal(false)
    inst.errors[0].should.contain('this.arr[1]')
    //console.log(inst.errors)
  })

  it('should call shape with constructed with an arg', function(){
    var inst = object({
          prop: mixed(),
        })

    inst.should.have.deep.property('fields.prop')
  })

  it('should handle empty keys', function(){
    var inst = object().shape({
          prop: mixed(),
        })

    inst.isValid({}).should.equal(true)

    inst.shape({ prop: mixed().required() })
      .isValid({}).should.equal(false)

  })

  it('should handle custom validation', function(){
    var inst = object().shape({
          prop: mixed(),
          other: mixed(),
        })

    inst = inst.validation('${path} oops', function(value){
      return false
    })

    inst.isValid({}).should.equal(false)

    inst.errors[0].should.equal('this oops')
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