import alternatives from '../src/alternatives';
import string from '../src/string';
import number from '../src/number';

describe('Alternative Types ', () => {
    it('should allow type if oneOfType', () => {
        let inst = alternatives().oneOfType([number(), string().strict()], {
            shouldUseForCasting: (schema, value) => !(value && value.getTime && typeof value.getTime === 'function')
        });

        return Promise.all([
            inst.validateSync('10', { strict: true }).should.equal('10'),
            inst.cast('10').should.equal(10),
            inst.cast('dedede').should.equal('dedede'),
            expect(() => inst.cast(new Date())).to.throw(
                /The value of field could not be cast to a value that satisfies the schema type: "alternatives"/
            ),
            inst.isValidSync(new Date()).should.equal(false),
            inst.isValidSync(10, { strict: true }).should.equal(true),
            inst.isValid(6).should.eventually().equal(true),
            inst.isValid('hfhfh').should.eventually().equal(true),

            inst.isValid(new Date()).should.eventually().equal(false),
            inst.isValid({}, { strict: true }).should.eventually().equal(false),
            // string schema  casts objects to string
            inst.isValid({}, { strict: false }).should.eventually().equal(true),

            inst.validate(new Date()).should.be.rejected().then(err => {
                err.errors[0].should.match(/this must be a `alternatives` type, but the final value was:/)
            }),
        ])
    });

    it('should unwrap promises if promiseOrType', () => {
        let inst = alternatives().promiseOrType(string().strict());
        let inst2 = alternatives().promiseOrType(string().strict(),{
            allowPromiseValueInSync:true
        });

        const p = Promise.resolve('dede');
        return Promise.all([
            inst.isValidSync(Promise.resolve('dede')).should.equal(false),
            inst.isValidSync('dede').should.equal(true),
            expect(()=>inst.validateSync(p)).to.throw(/ValidationError: A promise is not allowed in synchronous validation/),
            inst2.validateSync(p).should.equal(p),
            inst.validateSync('dede').should.equal('dede'),
            // Value is promise to be resolved to type
            inst.isValid(Promise.resolve('dsde')).should.eventually().equal(true),
            // Value is type should resolve to type
            inst.isValid('dsde').should.eventually().equal(true),
            inst.validate(Promise.resolve('dede')).should.eventually().equal('dede'),
            inst.validate('dede').should.eventually().equal('dede'),
            inst.isValid(Promise.resolve(10)).should.eventually().equal(false),
        ]);

    });

})
