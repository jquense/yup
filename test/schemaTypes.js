var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , CastError = require('../lib/errors/CastError')
  , Any = require('../lib/schemaObject')
  , string = require('../lib/types/String')
  , date = require('../lib/types/Date')
  , number = require('../lib/types/Number')
  , bool = require('../lib/types/boolean')
  , array = require('../lib/types/array')
  , object = require('../lib/types/Object');

chai.use(sinonChai);
chai.should();

describe( 'Schema ', function(){

  // it('should create a thing', function(){
  //   var inst = string().required().min(4).max(5)

  //   inst.should.be.an.instanceOf(string)
  //   inst.isValid('hello john').should.equal(false)
  //   inst.errors.should.contain('this field must be at least 5 characters')
  //   inst.isValid('hello john', 'name').should.equal(false)
  //   inst.errors.should.contain('name field must be at least 5 characters')
  //   inst.isValid('hello', 'name').should.equal(true)

  //   var other = inst.clone()
  //   other.should.be.an.instanceOf(string)
  //   other.isValid('hello john').should.equal(false)
  //   other.errors.should.contain('this field must be at least 5 characters')
  //   other.isValid('hello john', 'name').should.equal(false)
  //   other.errors.should.contain('name field must be at least 5 characters')
  //   other.isValid('hello', 'name').should.equal(true)
  // })

  it('should be immutable', function(){
    var inst = string(), next;

    inst.should.not.equal(inst = inst.required())
    inst.isValid().should.equal(false)
    next = inst.min(4)

    inst.isValid('hel').should.equal(true)
    inst.validations.length.should.equal(1)

    next.isValid('hel').should.equal(false)
    next.validations.length.should.equal(2)

    inst.should.be.an.instanceOf(string)
    next.should.be.an.instanceOf(string)
  })

  
  it('should limit values', function(){
    var inst = Any().oneOf(['hello', 5])

    inst.isValid(5).should.equal(true)
    inst.isValid('hello').should.equal(true)
    inst.isValid(6).should.equal(false)
    inst.errors[0].should.equal('this field must be one the following values: hello, 5')
  })

  it('should exclude values', function(){
    var inst = Any().notOneOf(['hello', 5])

    inst.isValid(6).should.equal(true)
    inst.isValid('hfhfh').should.equal(true)

    inst.isValid(5).should.equal(false)
    inst.errors[0].should.equal('this field must not be one the following values: hello, 5')
  })

  it('should respect strict', function(){
    var inst = string().oneOf(['hello', '5'])

    inst.isValid(5).should.equal(true)
    inst.strict().isValid(5).should.equal(false)
  })
})

describe('String types', function(){

  it('should CAST correctly', function(){
    
    var inst = string()

    inst.cast(5).should.equal('5')

    chai.expect(
      inst.cast(null)).to.equal(null)

    inst.cast('3').should.equal('3')
    inst.cast(false).should.equal('false')
    inst.cast(true).should.equal('true')

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
    var inst = string().required().min(4)

    string().isValid(null).should.equal(true)
    string().nullable(false).isValid(null).should.equal(false)

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
    var inst = number()

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
})

describe('Boolean types', function(){

  it('should CAST correctly', function(){
    var inst = bool();

    inst.cast('true').should.equal(true)
    inst.cast(1).should.equal(true)
    inst.cast(0).should.equal(false)

    chai.expect(
      inst.cast(null)).to.equal(null)
  })

  it('should handle DEFAULT', function(){
    var inst = bool()

    inst.default().should.equal(false)
    inst.default(true).required().default().should.equal(true)
  })

  it('should type check', function(){
    var inst = bool()

    inst.isType(1).should.equal(false)
    inst.isType(false).should.equal(true)
    inst.isType('true').should.equal(false)
    inst.isType(NaN).should.equal(false)
    inst.isType(34545).should.equal(false)
    chai.expect(
      inst.isType(null)).to.equal(false)
    inst.nullable().isType(null).should.equal(true)
  })

  it('should VALIDATE correctly', function(){

    var inst = bool().required()

    bool().isValid(null).should.equal(false)
    bool().nullable().isValid(null).should.equal(true)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })

})

describe('Date types', function(){

  it('should CAST correctly', function(){
    
    var inst = date()

    inst.cast(new Date).should.be.a('date')
    inst.cast('jan 15 2014').should.eql(new Date(2014,0,15))
    inst.cast('2014-09-23T19:25:25Z').should.eql(new Date(1411500325000))
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


describe('Array types', function(){

  it('should CAST correctly', function(){
    var inst = array();

    inst.cast('[2,3,5,6]').should.eql([2,3,5,6])

    inst.cast(['4', 5, false]).should.eql(['4', 5, false])

    inst.of(number()).cast(['4', 5, false]).should.eql([4,5,0])
    inst.of(string()).cast(['4', 5, false]).should.eql(['4','5','false'])

    chai.expect(
      inst.cast(null)).to.equal(null)
  })

  it('should handle DEFAULT', function(){
    var inst = array()

    inst.default().should.eql([])
    inst.default(function(){ return [1,2,3] }).default().should.eql([1,2,3])
  })

  it('should type check', function(){
    var inst = array()

    inst.isType([]).should.equal(true)
    inst.isType({}).should.equal(false)
    inst.isType('true').should.equal(false)
    inst.isType(NaN).should.equal(false)
    inst.isType(34545).should.equal(false)

    chai.expect(
      inst.isType(null)).to.equal(false)

    inst.nullable().isType(null).should.equal(true)
  })

  it('should VALIDATE correctly', function(){

    var inst = array().required()
                  .of(number().max(5))

    array().isValid(null).should.equal(false)
    array().nullable().isValid(null).should.equal(true)

    inst.isValid(['gg', 3]).should.equal(false)
    inst.isValid(['4', 3]).should.equal(true)
    inst.isValid(['7', 3]).should.equal(false)

    inst.isValid()
    inst.errors.length.should.equal(1)
    inst.errors[0].should.contain('required')
  })

})

describe('Object types', function(){

  it('should CAST correctly', function(){
    
    var inst = object()
      , obj = {
          num: '5',
          str: 'hello',
          arr: ['4', 5, false],
          dte: '2014-09-23T19:25:25Z',
          nested: { str: 5 },
          arrNested: [{ num: 5 }, { num: '5' }]
        }

    object()
      .shape({ hello: number() })
      .cast("{ \"hello\": \"5\" }").should.eql({ hello: 5 })

    chai.expect(
      object().cast('dfhdfh')).to.equal(null)

    inst = inst.shape({
        num: number(),
        str: string(),
        arr: array().of(number()),
        dte: date(),
        nested: object().shape({ str: string() }),
        arrNested: array().of(
          object().shape({ num: number() })
        )
      })
    //console.log(inst.cast(obj))

    inst.cast(obj).should.eql({
      num: 5,
      str: 'hello',
      arr: [4, 5, 0],
      dte: new Date(1411500325000),
      nested: { str: '5' },
      arrNested: [
        { num: 5 }, 
        { num: 5 }
      ]
    })
  })



  it.only('should VALIDATE correctly', function(){
    var inst
      , obj = {
          num: '4',
          str: 'hello',
          arr: ['4', 5, false],
          dte: '2014-09-23T19:25:25Z',
          nested: { str: 5 },
          arrNested: [{ num: 5 }, { num: '2' }]
        }

    inst = object().shape({
        num: number().max(4),
        str: string(),
        arr: array().of(number()),
        dte: date(),

        nested: object()
          .shape({ str: string().min(3) })
          .required(),

        arrNested: array().of(
          object().shape({ num: number() })
        )
      })

    inst.isValid(obj)
    console.log(inst.errors)
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