'use strict';
/*global describe, it */
var chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , ValidationError = require('../lib/util/validation-error')
  , Promise = require('es6-promise').Promise
  , mixed = require('../lib/mixed')
  , number = require('../lib/number')
  , string = require('../lib/string');

chai.use(chaiAsPromised);
chai.should();

describe( 'Mixed Types ', function(){

  it('should be immutable', function(){
    var inst = mixed(), next;

    inst.should.not.equal(next = inst.required())

    inst.should.be.an.instanceOf(mixed)
    next.should.be.an.instanceOf(mixed)

    return Promise.all([
      inst.isValid().should.eventually.equal(true),
      next.isValid().should.eventually.equal(false)
    ])
  })


  it('should limit values', function(){
    var inst = mixed().oneOf(['hello', 5])

    return Promise.all([
      inst.isValid(5).should.eventually.equal(true),
      inst.isValid('hello').should.eventually.equal(true),

      inst.validate(6).should.be.rejected.then(function(err){
        err.errors[0].should.equal('this must be one the following values: hello, 5')
      })
    ])
  })

  it('should exclude values', function(){
    var inst = mixed().notOneOf(['hello', 5])

    return Promise.all([
      inst.isValid(6).should.eventually.equal(true),
      inst.isValid('hfhfh').should.eventually.equal(true),

      inst.isValid(5).should.eventually.equal(false),

      inst.validate(5).should.be.rejected.then(function(err){
        err.errors[0].should.equal('this must not be one the following values: hello, 5')
      }),
      
      inst.oneOf([5]).isValid(5).should.eventually.equal(true)
    ])
  })

  it('should respect strict', function(){
    var inst = string().oneOf(['hello', '5'])

    return Promise.all([
      inst.isValid(5).should.eventually.equal(true),
      inst.strict().isValid(5).should.eventually.equal(false)
    ])
  })

  it('should allow custom validation of either style', function(){
    var inst = string()
      .validation('test a', function(val){
        return Promise.resolve(val === 'jim')
      })
      .validation('test b', function(val, done){
        process.nextTick(function(){
          done(null, val !== 'jim')
        })   
      }, true)

    return Promise.all([
      inst.validate('jim').should.be.rejected.then(function(e){
        e.errors[0].should.equal('test b')
      }),
      inst.validate('joe').should.be.rejected.then(function(e){
        e.errors[0].should.equal('test a')
      })
    ])
  })

  it('should respect callback interfaces', function(done){
    var inst = string().oneOf(['hello', '5'])

    inst.isValid(5, function(err, valid){
      valid.should.equal(true)
      chai.expect(err).to.equal(null)

      inst.strict().validate(5, function(err, value){
        err.should.be.an.instanceOf(ValidationError)
        chai.expect(value).to.equal(undefined)
        done()
      })
    })
  })

  it('should handle conditionals', function(){
    var inst = mixed().when('prop', { is: 5, then: mixed().required() })

    return Promise.all([
      inst._validate(undefined, {}, { parent: { prop: 5 }}).should.be.rejected,
      inst._validate(undefined, {}, { parent: { prop: 1 }}).should.be.fulfilled,
      inst._validate('hello', {},   { parent: { prop: 5 }}).should.be.fulfilled
    ])
    .then(function(){

      inst = string().when('prop', {
        is:        number().oneOf([5]),
        then:      string().required(),
        otherwise: string().min(4)
      })

      return Promise.all([
        inst._validate(undefined, {}, { parent: { prop: 5 }}).should.be.rejected,
        inst._validate('hello', {}, { parent: { prop: 1 }}).should.be.fulfilled,
        inst._validate('hel', {}, { parent: { prop: 1 }}).should.be.rejected
      ])
    })
  })

})



