'use strict';
/* global describe, it */
var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , string = require('../lib/string')
  , date = require('../lib/date')
  , number = require('../lib/number')
  , bool = require('../lib/boolean')
  , array = require('../lib/array')
  , object = require('../lib/object');

chai.use(sinonChai);
chai.should();


describe('Array types', function(){

  it('should CAST correctly', function(){
    var inst = array();

    inst.cast('[2,3,5,6]').should.eql([2,3,5,6])

    inst.cast(['4', 5, false]).should.eql(['4', 5, false])

    inst.of(number()).cast(['4', 5, false]).should.eql([4,5,0])
    inst.of(string()).cast(['4', 5, false]).should.eql(['4','5','false'])

    chai.expect(
      inst.cast(null)).to.equal(null)
  })

  it('should handle DEFAULT', function(){
    var inst = array()

    chai.expect(inst.default()).to.equal(undefined)
    inst.default(function(){ return [1,2,3] }).default().should.eql([1,2,3])
  })

  it('should type check', function(){
    var inst = array()

    inst.isType([]).should.equal(true)
    inst.isType({}).should.equal(false)
    inst.isType('true').should.equal(false)
    inst.isType(NaN).should.equal(false)
    inst.isType(34545).should.equal(false)

    chai.expect(
      inst.isType(null)).to.equal(false)

    inst.nullable().isType(null).should.equal(true)
  })

  it('should VALIDATE correctly', function(){

    var inst = array().required().of(number().max(5))

    array().isValid(null).should.equal(false)
    array().nullable().isValid(null).should.equal(true)

    inst.isValid(['gg', 3]).should.equal(false)
    inst.isValid(['4', 3]).should.equal(true)
    inst.isValid(['7', 3]).should.equal(false)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })

  it('should compact arrays', function(){
    var arr  = ['', 1, 0, 4, false, null]
      , inst = array()

    inst.compact().cast(arr)
      .should.eql([1,4])

    inst.compact(function(v){ return v == null })
      .cast(arr).should.eql(['',1, 0, 4, false])
  })
})
