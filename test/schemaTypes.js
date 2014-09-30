var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , MiniString = require('../lib/types/String');

chai.use(sinonChai);
chai.should();

describe( 'Schema ', function(){

  it('should create a thing', function(){
    var inst = MiniString().required().min(4).max(5)

    inst.should.be.an.instanceOf(MiniString)
    inst.isValid('hello john').should.equal(false)
    inst.errors.should.contain('this field must be at least 5 characters')
    inst.isValid('hello john', 'name').should.equal(false)
    inst.errors.should.contain('name field must be at least 5 characters')

    inst.isValid('hello', 'name').should.equal(true)
  })
})