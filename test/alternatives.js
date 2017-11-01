import alternatives from '../src/alternatives';
import mixed from '../src/mixed';
import object from '../src/object';
import string from '../src/string';
import number from '../src/number';
import reach from '../src/util/reach';

let noop = () => {}

function ensureSync(fn) {
  let run = false;
  let resolve = (t) => {
    if (!run) return t
    throw new Error('Did not execute synchonously')
  }
  let err = (t) => {
    if (!run) throw t
    throw new Error('Did not execute synchonously')
  }

  let result = fn().then(resolve, err)

  run = true;
  return result;
}
//
//global.YUP_USE_SYNC &&
//  it('[internal] normal methods should be running in sync Mode', async () => {
//    let schema = number()
//
//    await ensureSync(() => Promise.resolve()).should.be.rejected()
//
//    await ensureSync(() => schema.isValid('john'))
//      .should.be.become(false)
//
//    let err = await ensureSync(() => schema.validate('john'))
//      .should.be.rejected()
//
//    expect(err.message)
//      .to.match(/the final value was: `NaN`.+cast from the value `"john"`/)
//  })

describe('Alternative Types ', () => {


  it('should allow type if oneOfType', () => {
      let inst = alternatives().oneOfType([number(), string().strict()])
//      inst.cast('10').should.equal(10)
//      expect(() => inst.cast('dede')).to.throw(
//          /The value of field could not be cast to a value that satisfies the schema type: "number". \n\nattempted value: dede \nresult of cast: NaN/
//      )
      inst.isValidSync(new Date()).should.equal(false);
      inst.isValidSync(10).should.equal(true);

      return Promise.all([
          inst.isValid(6).should.eventually().equal(true),
          inst.isValid('hfhfh').should.eventually().equal(true),

          inst.isValid(new Date()).should.eventually().equal(false),
          inst.isValid({}).should.eventually().equal(false),

          inst.validate(new Date()).should.be.rejected().then(err => {
              err.errors[0].should.equal('this must be one of the following types: NumberSchema, StringSchema')
          }),
      ])
  })
})
