'use strict';
/* global describe, it */
var chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , Promise = require('promise/src/es6-extensions')
  , bool = require('../src/boolean');

chai.use(chaiAsPromised);
chai.should();


describe('Boolean types', function(){

  it('should CAST correctly', function(){
    var inst = bool();

    inst.cast('true').should.equal(true)
    inst.cast(1).should.equal(true)
    inst.cast(0).should.equal(false)

    chai.expect(
      inst.cast(null)).to.equal(false)

    chai.expect(
      inst.nullable().cast(null)).to.equal(null)
  })

  it('should handle DEFAULT', function(){
    var inst = bool()

    chai.expect(inst.default()).to.equal(undefined)
    inst.default(true).required().default().should.equal(true)
  })

  it('should type check', function(){
    var inst = bool()

    inst.isType(1).should.equal(false)
    inst.isType(false).should.equal(true)
    inst.isType('true').should.equal(false)
    inst.isType(NaN).should.equal(false)
    inst.isType(34545).should.equal(false)
    inst.isType(new Boolean(false)).should.equal(true)
    chai.expect(
      inst.isType(null)).to.equal(false)
    inst.nullable().isType(null).should.equal(true)
  })

  it('should VALIDATE correctly', function(){

    var inst = bool().required()

    return Promise.all([
      bool().isValid(null).should.eventually.equal(true), //coerced to false

      bool().strict().isValid(null).should.eventually.equal(false),

      bool().nullable().isValid(null).should.eventually.equal(true),

      inst.validate().should.be.rejected.then(function(err){
        err.errors.length.should.equal(1)
        err.errors[0].should.contain('required')
      })
    ])
  })
})
