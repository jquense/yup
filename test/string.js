'use strict';
/* global describe, it */
var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , string = require('../lib/string');

chai.use(sinonChai);
chai.should();


describe('String types', function(){

  it('should CAST correctly', function(){

    var inst = string()

    inst.cast(5).should.equal('5')

    chai.expect(
      inst.cast(null)).to.equal(null)

    inst.cast('3').should.equal('3')
    inst.cast(false).should.equal('false')
    inst.cast(true).should.equal('true')

    chai.expect(inst.cast()).to.equal('')

    inst.trim().cast(' 3  ').should.equal('3')
    inst.lowercase().cast('HellO JohN').should.equal('hello john')
    inst.uppercase().cast('HellO JohN').should.equal('HELLO JOHN')
  })

  it('should handle DEFAULT', function(){
    var inst = string()

    inst.default().should.equal('')
    inst.default('my_value').required().default().should.equal('my_value')
  })

  it('should type check', function(){
    var inst = string()

    inst.isType('5').should.equal(true)
    inst.isType(false).should.equal(false)
    inst.isType(null).should.equal(true)
    inst.nullable(false).isType(null).should.equal(false)
  })

  it('should VALIDATE correctly', function(){
    var inst = string().required().min(4).strict()

    string().strict().isValid(null).should.equal(true)
    string().strict().nullable(false).isValid(null).should.equal(false)

    inst.isValid('hello').should.equal(true)
    inst.isValid('hel').should.equal(false)

    inst.isValid('')
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })

  it('should check MATCHES correctly', function(){
    var v = string().matches(/(hi|bye)/);

    v.isValid('hi').should.equal(true)
    v.isValid('nope').should.equal(false)
    v.isValid('bye').should.equal(true)
  })

  it('should check MIN correctly', function(){
    var v = string().min(5);

    v.isValid('hiiofff').should.equal(true)
    v.isValid('big').should.equal(false)
    v.isValid('noffasfasfasf saf').should.equal(true)

  })

  it('should check MAX correctly', function(){
    var v = string().max(5);

    v.isValid('adgf').should.equal(true)
    v.isValid('bigdfdsfsdf').should.equal(false)
    v.isValid('no').should.equal(true)

    v.isValid(5).should.equal(true)
    v.isValid(new Date).should.equal(false)
  })
})