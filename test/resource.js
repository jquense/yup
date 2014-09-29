var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , Resource = require('../lib/resource')
  , Schema = require('../lib/schema')
  , ft = require('../lib/fieldTypes')
  , v = require('../lib/util/validators');

chai.use(sinonChai);
chai.should();

describe('Resources', function(){
  var userSpec = {
        url: '/user/${userId}',
        id: 'userId',
        schema: {
          fields: {
            userId: Number,
            name: String,
          }
        }
      };

  it('should create valid urls', function(){
    var user = Resource.create(userSpec);

    user.should.have.property('schema').that.is.an.instanceOf(Schema)

    user.getUrl({ userId: 3 }).should.equal('/user/3')
    user.getUrl().should.equal('/user')

  })

  it('should return an object', function(){
    var user = Resource.create(userSpec);

    user.should.have.property('schema').that.is.an.instanceOf(Schema)

    user.getUrl({ userId: 3 }).should.equal('/user/3')
    user.getUrl().should.equal('/user')

  })

})