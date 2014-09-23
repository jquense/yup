var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , fieldTypes = require('../lib/fieldTypes');

chai.use(sinonChai);
chai.should();


describe( 'when using field types', function(){


  it('should cast numbers correctly', function(){
    
    var inst = new fieldTypes.Number({ type: 4, defaultValue: 0 })

    inst.cast('5gg').should.equal(5)
    inst.cast('-4.5hh').should.equal(-4.5)
    inst.cast('gg').should.eql(NaN)
    inst.cast('').should.equal(0)
    inst.cast(false).should.equal(0)
    inst.cast(true).should.equal(1)

  })

  it('should cast strings correctly', function(){
    
    var inst = new fieldTypes.String()

    inst.cast(5).should.equal('5')
    inst.cast(null).should.equal('')
    inst.cast().should.eql('')
    inst.cast('3').should.equal('3')
    inst.cast(false).should.equal('false')
    inst.cast(true).should.equal('true')
  })
})