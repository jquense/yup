var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , mixed = require('../lib/mixed')
  , string = require('../lib/string');

chai.use(sinonChai);
chai.should();

describe( 'Mixed Types ', function(){

  it('should be immutable', function(){
    var inst = mixed(), next;

    inst.should.not.equal(next = inst.required())

    inst.isValid().should.equal(true)
    next.isValid().should.equal(false)

    inst.should.be.an.instanceOf(mixed)
    next.should.be.an.instanceOf(mixed)
  })

  
  it('should limit values', function(){
    var inst = mixed().oneOf(['hello', 5])

    inst.isValid(5).should.equal(true)
    inst.isValid('hello').should.equal(true)
    inst.isValid(6).should.equal(false)
    inst.errors[0].should.equal('this must be one the following values: hello, 5')
  })

  it('should exclude values', function(){
    var inst = mixed().notOneOf(['hello', 5])

    inst.isValid(6).should.equal(true)
    inst.isValid('hfhfh').should.equal(true)

    inst.isValid(5).should.equal(false)
    inst.errors[0].should.equal('this must not be one the following values: hello, 5')

    inst.oneOf([5]).isValid(5).should.equal(true)
  })

  it('should respect strict', function(){
    var inst = string().oneOf(['hello', '5'])

    inst.isValid(5).should.equal(true)
    inst.strict().isValid(5).should.equal(false)
  })

})



