'use strict';
var chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , Promise = require('promise/src/es6-extensions')
  , date = require('../src/date');

chai.use(chaiAsPromised);
chai.should();

function isValidDate(date){
  return date instanceof Date && !isNaN(date.getTime())
}

describe('Date types', function(){

  it('should CAST correctly', function(){

    var inst = date()

    inst.cast(null).should.not.satisfy(isValidDate)
    inst.cast('').should.not.satisfy(isValidDate)

    inst.cast(new Date()).should.be.a('date')
    inst.cast(new Date()).should.be.a('date')
    inst.cast('jan 15 2014').should.eql(new Date(2014, 0, 15))
    inst.cast('2014-09-23T19:25:25Z').should.eql(new Date(1411500325000))
  })

  it('should type check', function(){
    var inst = date()

    inst.isType(new Date()).should.equal(true)
    inst.isType(false).should.equal(false)
    inst.isType(null).should.equal(false)
    inst.isType(NaN).should.equal(false)
    inst.nullable().isType(new Date()).should.equal(true)
  })

  it('should VALIDATE correctly', function(){

    var inst = date().required().max(new Date(2014, 5, 15))

    return Promise.all([
      date().isValid(null).should.eventually.equal(false),
      date().nullable().isValid(null).should.eventually.equal(true),

      inst.isValid(new Date(2014, 0, 15)).should.eventually.equal(true),
      inst.isValid(new Date(2014, 7, 15)).should.eventually.equal(false),
      inst.isValid('5').should.eventually.equal(true),

      inst.validate().should.be.rejected.then(function(err){
        err.errors.length.should.equal(1)
        err.errors[0].should.contain('required')
      })
    ])
  })

  it('should check MIN correctly', function(){
    var v = date().min(new Date(2014, 3, 15));

    ;(function(){ date().max('hello') }).should.throw(TypeError)

    return Promise.all([
      v.isValid(new Date(2014, 5, 15)).should.eventually.equal(true),
      v.isValid(new Date(2014, 1, 15)).should.eventually.equal(false),

      v.isValid(null).should.eventually.equal(false)
    ])
  })

  it('should check MAX correctly', function(){
    var v = date().max(new Date(2014, 7, 15));

    ;(function(){ date().max('hello') }).should.throw(TypeError)

    return Promise.all([
      v.isValid(new Date(2014, 5, 15)).should.eventually.equal(true),
      v.isValid(new Date(2014, 9, 15)).should.eventually.equal(false),
      v.nullable(true).isValid(null).should.eventually.equal(true)
    ])
  })
})

