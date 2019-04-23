import { lazy, mixed } from '../src';

describe('lazy', function() {
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
  });
});
