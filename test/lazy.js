import { lazy, mixed } from '../src';

describe('lazy', function () {
  it('should throw on a non-schema value', () => {
    (() => lazy(() => undefined).validate()).should.throw();
  });

  describe('mapper', () => {
    const value = 1;
    let mapper;

    beforeEach(() => {
      mapper = sinon.stub();
      mapper.returns(mixed());
    });

    it('should call with value', () => {
      lazy(mapper).validate(value);
      mapper.should.have.been.calledWith(value);
    });

    it('should call with context', () => {
      const context = {
        a: 1,
      };
      lazy(mapper).validate(value, context);
      mapper.should.have.been.calledWithExactly(value, context);
    });

    it('should allow meta', () => {
      const meta = { a: 1 };
      const schema = lazy(mapper).meta(meta);

      expect(schema.meta()).to.eql(meta);

      expect(schema.meta({ added: true })).to.not.eql(schema.meta());

      expect(schema.meta({ added: true }).meta()).to.eql({ a: 1, added: true });
    });
  });
});
