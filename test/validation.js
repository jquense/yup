var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , fieldTypes = require('../lib/fieldTypes')
  , validators = require('../lib/util/validators');

chai.use(sinonChai);
chai.should();


describe( 'when using validator creators', function(){

  it('should create the correct object', function(){
    var v = validators.range(5, 10);

    v.should.have.keys(['validate', 'message'])
    v.validate.should.be.a('function')
    v.message.should.be.a('string')

    //console.log(v, v.validator(15))
  })

  it('should accept a new message', function(){
    
    validators.range(5, 10, 'all whaaaat').message.should.equal('all whaaaat')
  })

  it('should interpolate the message', function(){
    validators.range(5, 10, 'all ${min} and ${ max }')
      .message.should.equal('all 5 and 10')
  })

})


describe( 'when using validators', function(){

  it('should check REQUIRED correctly', function(){
    var v = validators.required();

    v.validate(5, new fieldTypes.Number).should.equal(true)
    v.validate('f', new fieldTypes.Number).should.equal(false)
    v.validate(null, new fieldTypes.Number).should.equal(false)

    v.validate('f', new fieldTypes.String).should.equal(true)
    v.validate(5, new fieldTypes.String).should.equal(false)
    v.validate(null, new fieldTypes.String).should.equal(false)
 
    v.validate(new Date, new fieldTypes.Date).should.equal(true)
    v.validate('f', new fieldTypes.Date).should.equal(false)
    v.validate(null, new fieldTypes.Date).should.equal(false)

    v.validate(false, new fieldTypes.Boolean).should.equal(true)
    v.validate('f', new fieldTypes.Boolean).should.equal(false)
    v.validate(null, new fieldTypes.Boolean).should.equal(false)

    v.validate(new Date, new fieldTypes.Date).should.equal(true)
    v.validate('f', new fieldTypes.Date).should.equal(false)
    v.validate(null, new fieldTypes.Date).should.equal(false)
  })

  it('should check MATCHES correctly', function(){
    var v = validators.matches(/(hi|bye)/);

    v.validate('hi', new fieldTypes.String).should.equal(true)
    v.validate('nope', new fieldTypes.String).should.equal(false)
    v.validate('bye', new fieldTypes.String).should.equal(true)
  })

  it('should check MIN correctly', function(){
    var v = validators.min(5);

    v.validate(5, new fieldTypes.Number).should.equal(true)
    v.validate(2, new fieldTypes.Number).should.equal(false)
    v.validate(10, new fieldTypes.Number).should.equal(true)

    v.validate('hiiofff', new fieldTypes.String).should.equal(true)
    v.validate('big', new fieldTypes.String).should.equal(false)
    v.validate('noffasfasfasf saf', new fieldTypes.String).should.equal(true)

    v = validators.min(new Date(2014, 3, 15));

    v.validate(new Date(2014, 5, 15), new fieldTypes.Date).should.equal(true)
    v.validate(new Date(2014, 1, 15), new fieldTypes.Date).should.equal(false)
    v.validate(null, new fieldTypes.Date).should.equal(false)
  })

  it('should check MAX correctly', function(){
    var v = validators.max(5);

    v.validate(5, new fieldTypes.Number).should.equal(true)
    v.validate(10, new fieldTypes.Number).should.equal(false)
    v.validate(2, new fieldTypes.Number).should.equal(true)

    v.validate('adgf', new fieldTypes.String).should.equal(true)
    v.validate('bigdfdsfsdf', new fieldTypes.String).should.equal(false)
    v.validate('no', new fieldTypes.String).should.equal(true)

    v = validators.max(new Date(2014, 7, 15));

    v.validate(new Date(2014, 5, 15), new fieldTypes.Date).should.equal(true)
    v.validate(new Date(2014, 9, 15), new fieldTypes.Date).should.equal(false)
    v.validate(null, new fieldTypes.Date).should.equal(false)
  })

  it('should check RANGE correctly', function(){
    var v = validators.range(5, 10);

    v.validate(5, new fieldTypes.Number).should.equal(true)
    v.validate(2, new fieldTypes.Number).should.equal(false)
    v.validate(10, new fieldTypes.Number).should.equal(true)

    v.validate('adgfff', new fieldTypes.String).should.equal(true)
    v.validate('fgf', new fieldTypes.String).should.equal(false)
    v.validate('fdffsfafasfasfffff', new fieldTypes.String).should.equal(false)

    v = validators.range(new Date(2014, 5, 15), new Date(2014, 7, 15));

    v.validate(new Date(2014, 5, 15), new fieldTypes.Date).should.equal(true)
    v.validate(new Date(2014, 9, 15), new fieldTypes.Date).should.equal(false)
    v.validate(null, new fieldTypes.Date).should.equal(false)
  })
})