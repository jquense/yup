'use strict';
/* global describe, it */
var chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , Promise = require('promise/src/es6-extensions')
  , number = require('../src/number');

chai.use(chaiAsPromised);
chai.should();

describe('Number types', function(){

  it('should CAST correctly', function(){

    var inst = number(), date = new Date()

    chai.expect(
      inst.cast(null)).to.eql(NaN)

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

    chai.expect(inst.nullable()
      .integer()
      .round()
      .cast(null)).to.equal(null)
  })

  it('should handle DEFAULT', function(){
    var inst = number().default(0)

    inst.default().should.equal(0)
    inst.default(5).required().default().should.equal(5)
  })

  it('should type check', function(){
    var inst = number()

    inst.isType(5).should.equal(true)
    inst.isType(new Number(5)).should.equal(true)
    inst.isType(false).should.equal(false)
    inst.isType(null).should.equal(false)
    inst.isType(NaN).should.equal(false)
    inst.nullable().isType(null).should.equal(true)
  })

  it('should VALIDATE correctly', function(){

    var inst = number().required().min(4)

    return Promise.all([
      number().isValid(null).should.eventually.equal(false),
      number().nullable().isValid(null).should.eventually.equal(true),

      inst.isValid(5).should.eventually.equal(true),
      inst.isValid(2).should.eventually.equal(false),

      inst.validate().should.be.rejected.then(function(err){
        err.errors.length.should.equal(1)
        err.errors[0].should.contain('required')
      })
    ])
  })

  it('should check MIN correctly', function(){
    var v = number().min(5);

    return Promise.all([
      v.isValid(7).should.eventually.equal(true),
      v.isValid(2).should.eventually.equal(false),
      v.isValid(35738787838).should.eventually.equal(true),

      v.min(10).min(15).isValid(14).should.eventually.equal(false),

      v.isValid(new Date).should.eventually.equal(true),

      v.isValid(null).should.eventually.equal(false), // -> NaN fails type check

      v.nullable().isValid(null).should.eventually.equal(true),
    ])
  })

  it('should check MAX correctly', function(){
    var v = number().max(5);

    return Promise.all([
      v.isValid(4).should.eventually.equal(true),
      v.isValid(10).should.eventually.equal(false),
      v.isValid(-5222).should.eventually.equal(true),

      v.isValid(false).should.eventually.equal(true),
      v.isValid(new Date).should.eventually.equal(false),

      v.max(10).max(15).isValid(16).should.eventually.equal(false),

      v.isValid(null).should.eventually.equal(false), // null -> NaN fails type check

      v.nullable().isValid(null).should.eventually.equal(true),
    ])
  })

  it('should check POSITIVE correctly', function(){
    var v = number().positive();

    return Promise.all([
      v.isValid(7).should.eventually.equal(true),

      v.isValid(0).should.eventually.equal(true),

      v.validate(-4).should.be.rejected.then(null, function(err){
        err.errors[0].should.contain('this must be a positive number')
      })
    ])
  })

  it('should check NEGATIVE correctly', function(){
    var v = number().negative();

    return Promise.all([
      v.isValid(-4).should.eventually.equal(true),

      v.isValid(0).should.eventually.equal(true),

      v.validate(10).should.be.rejected.then(null, function(err){
        err.errors[0].should.contain('this must be a negative number')
      })
    ])
  })
})
