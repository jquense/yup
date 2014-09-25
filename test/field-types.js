var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , v = require('../lib/util/validators')
  , fieldTypes = require('../lib/fieldTypes');

chai.use(sinonChai);
chai.should();


describe('Number fields', function(){ 
  it('should CAST number correctly', function(){
    
    var inst = new fieldTypes.Number({ type: 4, defaultValue: 0 })

    inst.cast('5gg').should.equal(5)
    inst.cast('-4.5hh').should.equal(-4.5)
    inst.cast('gg').should.eql(NaN)
    inst.cast('').should.equal(0)
    inst.cast(false).should.equal(0)
    inst.cast(true).should.equal(1)

  })

  it('should VALIDATE number correctly', function(){
    var inst = fieldTypes.Number.create({
      validations: [ v.required(), v.min(4) ] 
    })

    inst.isValid(5).should.equal(true)
    inst.isValid(3).should.equal(false)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })
})

describe('String fields', function(){

  it('should CAST correctly', function(){
    
    var inst = new fieldTypes.String()

    inst.cast(5).should.equal('5')
    inst.cast(null).should.equal('')
    inst.cast().should.eql('')
    inst.cast('3').should.equal('3')
    inst.cast(false).should.equal('false')
    inst.cast(true).should.equal('true')
  })

  it('should VALIDATE correctly', function(){
    var inst = fieldTypes.String.create({
      validations: [ v.required(), v.min(4) ] 
    })

    inst.isValid('hello').should.equal(true)
    inst.isValid('hel').should.equal(false)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })
})

describe('Boolean fields', function(){

  it('should CAST correctly', function(){
    
    var inst = new fieldTypes.Boolean()

    inst.cast('true').should.equal(true)
    inst.cast('1').should.equal(true)
    inst.cast(1).should.eql(true)
    inst.cast(0).should.equal(false)
    inst.cast(false).should.equal(false)
    inst.cast('false').should.equal(false)
    inst.cast(null).should.equal(false)
  })

  it('should VALIDATE correctly', function(){
    var inst = fieldTypes.Boolean.create({
      validations: [ v.required() ] 
    })

    inst.isValid(false).should.equal(true)
    inst.isValid(3).should.equal(false)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })

})

describe('Date fields', function(){

  it('should CAST correctly', function(){
    
    var inst = new fieldTypes.Date()

    inst.cast(new Date).should.be.a('date')
    inst.cast('jan 15 2014').should.eql(new Date(2014,0,15))
    inst.cast('2014-09-23T19:25:25Z').should.eql(new Date(1411500325000))
  })

  it('should VALIDATE correctly', function(){
    var inst = fieldTypes.Date.create({
      validations: [ v.required(), v.max(new Date(2014, 5, 15)) ] 
    })

    inst.isValid(new Date(2014,0,15)).should.equal(true)
    inst.isValid(new Date(2014,7,15)).should.equal(false)
    inst.isValid('5').should.equal(false)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })
})

describe('Mixed fields', function(){

  it('should CAST correctly', function(){
    
    var inst = new fieldTypes.Mixed()

    inst.cast('true').should.equal('true')
    inst.cast('1').should.equal('1')
    inst.cast(1).should.eql(1)
    inst.cast(0).should.equal(0)
    inst.cast(false).should.equal(false)
  })

  it('should VALIDATE correctly', function(){
    var inst = fieldTypes.Boolean.create({
      validations: [ v.required() ] 
    })

    inst.isValid(false).should.equal(true)
    inst.isValid(null).should.equal(false)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })

})