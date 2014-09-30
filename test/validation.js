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

    v.should.have.keys(['isValid'])
    v.isValid.should.be.a('function')
  })

  it('should accept a new message', function(){
    
    var v = validators.range(5, 10, 'all whaaaat')
    v.isValid(4, new fieldTypes.Number)
    v.error.should.equal('all whaaaat')
  })

  it('should interpolate the message', function(){
    var v = validators.range(5, 10, '${name} all ${min} and ${ max }')

    v.isValid(4, fieldTypes.Number.create({ path: 'steve'}) )
    v.error.should.equal('steve all 5 and 10')

    v.isValid(4, fieldTypes.Number.create({ path: 'jimmy'}))
    v.error.should.equal('jimmy all 5 and 10')
  })

})


describe( 'when using validators', function(){

  it('should check REQUIRED correctly', function(){
    var v = validators.required();

    v.isValid(5, new fieldTypes.Number).should.equal(true)
    v.isValid('f', new fieldTypes.Number).should.equal(false)
    v.isValid(null, new fieldTypes.Number).should.equal(false)

    v.isValid('f', new fieldTypes.String).should.equal(true)
    v.isValid(5, new fieldTypes.String).should.equal(false)
    v.isValid(null, new fieldTypes.String).should.equal(false)
 
    v.isValid(new Date, new fieldTypes.Date).should.equal(true)
    v.isValid('f', new fieldTypes.Date).should.equal(false)
    v.isValid(null, new fieldTypes.Date).should.equal(false)

    v.isValid(false, new fieldTypes.Boolean).should.equal(true)
    v.isValid('f', new fieldTypes.Boolean).should.equal(false)
    v.isValid(null, new fieldTypes.Boolean).should.equal(false)

    v.isValid(new Date, new fieldTypes.Date).should.equal(true)
    v.isValid('f', new fieldTypes.Date).should.equal(false)
    v.isValid(null, new fieldTypes.Date).should.equal(false)
  })

  it('should check MATCHES correctly', function(){
    var v = validators.matches(/(hi|bye)/);

    v.isValid('hi', new fieldTypes.String).should.equal(true)
    v.isValid('nope', new fieldTypes.String).should.equal(false)
    v.isValid('bye', new fieldTypes.String).should.equal(true)
  })

  it('should check MIN correctly', function(){
    var v = validators.min(5);

    v.isValid(5, new fieldTypes.Number).should.equal(true)
    v.isValid(2, new fieldTypes.Number).should.equal(false)
    v.isValid(10, new fieldTypes.Number).should.equal(true)

    v.isValid('hiiofff', new fieldTypes.String).should.equal(true)
    v.isValid('big', new fieldTypes.String).should.equal(false)
    v.isValid('noffasfasfasf saf', new fieldTypes.String).should.equal(true)

    v = validators.min(new Date(2014, 3, 15));

    v.isValid(new Date(2014, 5, 15), new fieldTypes.Date).should.equal(true)
    v.isValid(new Date(2014, 1, 15), new fieldTypes.Date).should.equal(false)
    v.isValid(null, new fieldTypes.Date).should.equal(false)
  })

  it('should check MAX correctly', function(){
    var v = validators.max(5);

    v.isValid(5, new fieldTypes.Number).should.equal(true)
    v.isValid(10, new fieldTypes.Number).should.equal(false)
    v.isValid(2, new fieldTypes.Number).should.equal(true)

    v.isValid('adgf', new fieldTypes.String).should.equal(true)
    v.isValid('bigdfdsfsdf', new fieldTypes.String).should.equal(false)
    v.isValid('no', new fieldTypes.String).should.equal(true)

    v = validators.max(new Date(2014, 7, 15));

    v.isValid(new Date(2014, 5, 15), new fieldTypes.Date).should.equal(true)
    v.isValid(new Date(2014, 9, 15), new fieldTypes.Date).should.equal(false)
    v.isValid(null, new fieldTypes.Date).should.equal(false)
  })

  it('should check RANGE correctly', function(){
    var v = validators.range(5, 10);

    v.isValid(5, new fieldTypes.Number).should.equal(true)
    v.isValid(2, new fieldTypes.Number).should.equal(false)
    v.isValid(10, new fieldTypes.Number).should.equal(true)

    v.isValid('adgfff', new fieldTypes.String).should.equal(true)
    v.isValid('fgf', new fieldTypes.String).should.equal(false)
    v.isValid('fdffsfafasfasfffff', new fieldTypes.String).should.equal(false)

    v = validators.range(new Date(2014, 5, 15), new Date(2014, 7, 15));

    v.isValid(new Date(2014, 5, 15), new fieldTypes.Date).should.equal(true)
    v.isValid(new Date(2014, 9, 15), new fieldTypes.Date).should.equal(false)
    v.isValid(null, new fieldTypes.Date).should.equal(false)
  })
})