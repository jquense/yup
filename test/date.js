var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , date = require('../lib/date');

chai.use(sinonChai);
chai.should();


describe('Date types', function(){

  it('should CAST correctly', function(){
    
    var inst = date()

    inst.cast(new Date).should.be.a('date')
    inst.cast('jan 15 2014').should.eql(new Date(2014,0,15))
    inst.cast('2014-09-23T19:25:25Z').should.eql(new Date(1411500325000))
  })

  it('should type check', function(){
    var inst = date()

    inst.isType(new Date).should.equal(true)
    inst.isType(false).should.equal(false)
    inst.isType(null).should.equal(false)
    inst.isType(NaN).should.equal(false)
    inst.nullable().isType(new Date).should.equal(true)
  })

  it('should VALIDATE correctly', function(){

    var inst = date().required().max(new Date(2014, 5, 15))

    date().isValid(null).should.equal(false)
    date().nullable().isValid(null).should.equal(true)

    inst.isValid(new Date(2014,0,15)).should.equal(true)
    inst.isValid(new Date(2014,7,15)).should.equal(false)
    inst.isValid('5').should.equal(true)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })

  it('should check MIN correctly', function(){
    var v = date().min(new Date(2014, 3, 15));

    v.isValid(new Date(2014, 5, 15)).should.equal(true)
    v.isValid(new Date(2014, 1, 15)).should.equal(false)

    ;(function(){ date().max('hello') }).should.throw(TypeError)

    v.isValid(null).should.equal(false)
  })

  it('should check MAX correctly', function(){
    var v = date().max(new Date(2014, 7, 15));

    v.isValid(new Date(2014, 5, 15)).should.equal(true)
    v.isValid(new Date(2014, 9, 15)).should.equal(false)

    ;(function(){ date().max('hello') }).should.throw(TypeError)

    v.nullable(true).isValid(null).should.equal(true)
  })
})

