'use strict';
/* global describe, it */
var chai  = require('chai')
  , Promise = require('promise/src/es6-extensions')
  , sinonChai = require('sinon-chai')
  , chaiAsPromised = require('chai-as-promised')
  , string = require('../src/string');

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.should();

describe('String types', function(){

  it('should CAST correctly', function(){

    var inst = string()

    inst.cast(5).should.equal('5')

    chai.expect(
      inst.cast(null)).to.equal('')

    chai.expect(
      inst.nullable().cast(null)).to.equal(null)

    inst.cast('3').should.equal('3')
    inst.cast(false).should.equal('false')
    inst.cast(true).should.equal('true')

    chai.expect(inst.cast()).to.equal(undefined)

    inst.trim().cast(' 3  ').should.equal('3')

    inst.lowercase().cast('HellO JohN').should.equal('hello john')
    inst.uppercase().cast('HellO JohN').should.equal('HELLO JOHN')

    chai.expect(inst.nullable()
      .trim()
      .lowercase()
      .uppercase()
      .cast(null)).to.equal(null)
  })

  it('should handle DEFAULT', function(){
    var inst = string()

    inst.default('my_value').required().default().should.equal('my_value')
  })

  it('should type check', function(){
    var inst = string()

    inst.isType('5').should.equal(true)
    inst.isType(new String('5')).should.equal(true)
    inst.isType(false).should.equal(false)
    inst.isType(null).should.equal(false)
    inst.nullable(false).isType(null).should.equal(false)
  })

  it('should VALIDATE correctly', function(){
    var inst = string().required().min(4).strict()

    return Promise.all([

      string().strict().isValid(null).should.eventually.equal(false),

      string().strict().nullable(true).isValid(null).should.eventually.equal(true),

      inst.isValid('hello').should.eventually.equal(true),

      inst.isValid('hel').should.eventually.equal(false),

      inst.validate('').should.be.rejected.then(function(err) {
        err.errors.length.should.equal(1)
      })
    ])
  })

  it('should check MATCHES correctly', function(){
    var v = string().matches(/(hi|bye)/);

    return Promise.all([
      v.isValid('hi').should.eventually.equal(true),
      v.isValid('nope').should.eventually.equal(false),
      v.isValid('bye').should.eventually.equal(true)
    ])
  })

  it('should check MIN correctly', function(){
    var v = string().min(5);

    return Promise.all([
      v.isValid('hiiofff').should.eventually.equal(true),
      v.isValid('big').should.eventually.equal(false),
      v.isValid('noffasfasfasf saf').should.eventually.equal(true),

      v.isValid(null).should.eventually.equal(false), // null -> ''
      v.nullable().isValid(null).should.eventually.equal(true) // null -> null
    ])

  })

  it('should check MAX correctly', function(){
    var v = string().max(5);

    return Promise.all([
      v.isValid('adgf').should.eventually.equal(true),
      v.isValid('bigdfdsfsdf').should.eventually.equal(false),
      v.isValid('no').should.eventually.equal(true),

      v.isValid(5).should.eventually.equal(true),
      v.isValid(new Date()).should.eventually.equal(false),

      v.isValid(null).should.eventually.equal(true),

      v.nullable().isValid(null).should.eventually.equal(true)
    ])
  })

  it('should validate transforms', function(){
    return Promise.all([
      string().trim().isValid(' 3  ').should.eventually.equal(true),

      string().lowercase().isValid('HellO JohN').should.eventually.equal(true),

      string().uppercase().isValid('HellO JohN').should.eventually.equal(true),

      string().trim().isValid(' 3  ', { strict: true })
        .should.eventually.equal(false),

      string().lowercase().isValid('HellO JohN', { strict: true })
        .should.eventually.equal(false),

      string().uppercase().isValid('HellO JohN', { strict: true })
        .should.eventually.equal(false)
    ])
  })
})
