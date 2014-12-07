'use strict';
/* global describe, it */
var chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , Promise = require('es6-promise').Promise
  , string = require('../dist/string')
  , number = require('../dist/number')
  , array = require('../dist/array');

chai.use(chaiAsPromised);
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

    return Promise.all([
      array().isValid(null).should.eventually.equal(false),
      array().nullable().isValid(null).should.eventually.equal(true),

      inst.isValid(['gg', 3]).should.eventually.equal(false),
      
      inst.isValid(['4', 3]).should.eventually.equal(true),

      inst.validate(['4', 3]).should.be.fulfilled.then(function(val){
        val.should.eql([4, 3])
      }),

      inst.validate(['7', 3]).should.be.rejected,

      inst.validate().should.be.rejected.then(function(err){
        err.errors.length.should.equal(1)
        err.errors[0].should.contain('required')
      })
    ])
    
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
