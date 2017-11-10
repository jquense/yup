import alternatives from '../src/alternatives';
import string from '../src/string';
import number from '../src/number';

describe('Alternative Types ', () => {
    it('should allow type if oneOfType', () => {
        let inst = alternatives().oneOfType([number(), string().strict()]);

        return Promise.all([
            inst.validateSync('10', { strict: true }).should.equal('10'),
            inst.cast('10').should.equal(10),
            inst.cast('dedede').should.equal('dedede'),
            inst.cast(new Date()).should.be.a('string'),
            inst.isValidSync(new Date()).should.equal(false),
            inst.isValidSync(10, { strict: true }).should.equal(true),
            inst.isValid(6).should.eventually().equal(true),
            inst.isValid('hfhfh').should.eventually().equal(true),

            inst.isValid(new Date()).should.eventually().equal(false),
            inst.isValid({}).should.eventually().equal(false),

            inst.validate(new Date()).should.be.rejected().then(err => {
                err.errors[0].should.match(/this must be a `alternatives` type, but the final value was:/)
            }),
        ])
    });
});
