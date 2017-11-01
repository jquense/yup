import alternatives from '../src/alternatives';
import string from '../src/string';
import number from '../src/number';

describe('Alternative Types ', () => {
  it('should allow type if oneOfType', () => {
      let inst = alternatives().oneOfType([number(), string().strict()], {
          shouldUseForCasting: (schema, value) => !(value && value.getTime && typeof value.getTime === 'function')
      })
      inst.validateSync('10', {strict:true}).should.equal('10');
      inst.cast('10').should.equal(10)
      inst.cast('dedede').should.equal('dedede')
      expect(() => inst.cast(new Date())).to.throw(
          /The value of field could not be cast to a value that satisfies the schema type: "alternatives"/
      )
      inst.isValidSync(new Date()).should.equal(false);
      inst.isValidSync(10, {strict:true}).should.equal(true);

      return Promise.all([
          inst.isValid(6).should.eventually().equal(true),
          inst.isValid('hfhfh').should.eventually().equal(true),

          inst.isValid(new Date()).should.eventually().equal(false),
          inst.isValid({}, {strict:true}).should.eventually().equal(false),
          // string schema  casts objects to string
          inst.isValid({}, {strict:false}).should.eventually().equal(true),

          inst.validate(new Date()).should.be.rejected().then(err => {
              err.errors[0].should.match(/this must be a `alternatives` type, but the final value was:/)
          }),
      ])
  })
})
