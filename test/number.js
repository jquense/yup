'use strict';
/* global describe, it */
var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , number = require('../lib/number');

chai.use(sinonChai);
chai.should();

describe('Number types', function(){

  it('should CAST correctly', function(){

    var inst = number(), date = new Date

    chai.expect(
      inst.cast(null)).to.equal(null)

    inst.cast('5').should.equal(5)
    inst.cast('').should.eql(NaN)
    inst.cast(3).should.equal(3)
    inst.cast(false).should.equal(0)
    inst.cast(true).should.equal(1)
    inst.cast(date).should.equal(date.getTime())

    inst.integer().cast(45.55).should.equal(45)
    inst.round('Floor').cast(45.99999).should.equal(45)
    inst.round('ceIl').cast(45.1111).should.equal(46)
    inst.round().cast(45.444444).should.equal(45)
    ;(function(){ inst.round('fasf') }).should.throw(TypeError)
  })

  it('should handle DEFAULT', function(){
    var inst = number().default(0)

    inst.default().should.equal(0)
    inst.default(5).required().default().should.equal(5)
  })

  it('should type check', function(){
    var inst = number()

    inst.isType(5).should.equal(true)
    inst.isType(false).should.equal(false)
    inst.isType(null).should.equal(false)
    inst.isType(NaN).should.equal(false)
    inst.nullable().isType(null).should.equal(true)
  })

  it('should VALIDATE correctly', function(){

    var inst = number().required().min(4)

    number().isValid(null).should.equal(false)
    number().nullable().isValid(null).should.equal(true)

    inst.isValid(5).should.equal(true)
    inst.isValid(2).should.equal(false)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })

  it('should check MIN correctly', function(){
    var v = number().min(5);

    v.isValid(7).should.equal(true)
    v.isValid(2).should.equal(false)
    v.isValid(35738787838).should.equal(true)
    v.isValid(new Date).should.equal(true)
  })

  it('should check MAX correctly', function(){
    var v = number().max(5);

    v.isValid(4).should.equal(true)
    v.isValid(10).should.equal(false)
    v.isValid(-5222).should.equal(true)

    v.isValid(false).should.equal(true)
    v.isValid(new Date).should.equal(false)
  })

  it('should check POSITIVE correctly', function(){
    var v = number().positive();

    v.isValid(7).should.equal(true)
    v.isValid(-4).should.equal(false)
    v.errors[0].should.equal('this must be a positive number')
    v.isValid(0).should.equal(true)
  })

  it('should check NEGATIVE correctly', function(){
    var v = number().negative();

    v.isValid(-4).should.equal(true)
    v.isValid(10).should.equal(false)
    v.errors[0].should.equal('this must be a negative number')
    v.isValid(0).should.equal(true)
  })
})
