import { ref, date } from '../src';

function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

describe('Date types', () => {
  it('should CAST correctly', () => {
    var inst = date();

    inst.cast(new Date()).should.be.a('date');
    inst.cast('jan 15 2014').should.eql(new Date(2014, 0, 15));
    inst.cast('2014-09-23T19:25:25Z').should.eql(new Date(1411500325000));
    // Leading-zero milliseconds
    inst.cast('2016-08-10T11:32:19.012Z').should.eql(new Date(1470828739012));
    // Microsecond precision
    inst.cast('2016-08-10T11:32:19.2125Z').should.eql(new Date(1470828739212));
  });

  it('should return invalid date for failed casts', function() {
    var inst = date();

    inst.cast(null, { assert: false }).should.not.satisfy(isValidDate);
    inst.cast('', { assert: false }).should.not.satisfy(isValidDate);
  });

  it('should type check', () => {
    var inst = date();

    inst.isType(new Date()).should.equal(true);
    inst.isType(false).should.equal(false);
    inst.isType(null).should.equal(false);
    inst.isType(NaN).should.equal(false);
    inst
      .nullable()
      .isType(new Date())
      .should.equal(true);
  });

  it('should VALIDATE correctly', () => {
    var inst = date()
      .required()
      .max(new Date(2014, 5, 15));

    return Promise.all([
      date()
        .isValid(null)
        .should.eventually()
        .equal(false),
      date()
        .nullable()
        .isValid(null)
        .should.eventually()
        .equal(true),

      inst
        .isValid(new Date(2014, 0, 15))
        .should.eventually()
        .equal(true),
      inst
        .isValid(new Date(2014, 7, 15))
        .should.eventually()
        .equal(false),
      inst
        .isValid('5')
        .should.eventually()
        .equal(true),

      inst
        .validate()
        .should.be.rejected()
        .then(err => {
          err.errors.length.should.equal(1);
          err.errors[0].should.contain('required');
        }),
    ]);
  });

  it('should check MIN correctly', () => {
    var min = new Date(2014, 3, 15),
      invalid = new Date(2014, 1, 15),
      valid = new Date(2014, 5, 15);
    (function() {
      date().max('hello');
    }.should.throw(TypeError));
    (function() {
      date().max(ref('$foo'));
    }.should.not.throw());

    return Promise.all([
      date()
        .min(min)
        .isValid(valid)
        .should.eventually()
        .equal(true),
      date()
        .min(min)
        .isValid(invalid)
        .should.eventually()
        .equal(false),
      date()
        .min(min)
        .isValid(null)
        .should.eventually()
        .equal(false),

      date()
        .min(ref('$foo'))
        .isValid(valid, { context: { foo: min } })
        .should.eventually()
        .equal(true),
      date()
        .min(ref('$foo'))
        .isValid(invalid, { context: { foo: min } })
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should check MAX correctly', () => {
    var max = new Date(2014, 7, 15),
      invalid = new Date(2014, 9, 15),
      valid = new Date(2014, 5, 15);
    (function() {
      date().max('hello');
    }.should.throw(TypeError));
    (function() {
      date().max(ref('$foo'));
    }.should.not.throw());

    return Promise.all([
      date()
        .max(max)
        .isValid(valid)
        .should.eventually()
        .equal(true),
      date()
        .max(max)
        .isValid(invalid)
        .should.eventually()
        .equal(false),
      date()
        .max(max)
        .nullable(true)
        .isValid(null)
        .should.eventually()
        .equal(true),

      date()
        .max(ref('$foo'))
        .isValid(valid, { context: { foo: max } })
        .should.eventually()
        .equal(true),
      date()
        .max(ref('$foo'))
        .isValid(invalid, { context: { foo: max } })
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should check LESSTHAN correctly', () => {
    var lessThan = new Date(2014, 7, 15),
      invalid = new Date(2014, 9, 15),
      valid = new Date(2014, 5, 15);
    (function() {
      date().lessThan('hello');
    }.should.throw(TypeError));
    (function() {
      date().lessThan(ref('$foo'));
    }.should.not.throw());

    return Promise.all([
      date()
        .lessThan(lessThan)
        .isValid(valid)
        .should.eventually()
        .equal(true),
      date()
        .lessThan(lessThan)
        .isValid(invalid)
        .should.eventually()
        .equal(false),
      date()
        .lessThan(lessThan)
        .isValid(lessThan)
        .should.eventually()
        .equal(false),
      date()
        .lessThan(lessThan)
        .nullable(true)
        .isValid(null)
        .should.eventually()
        .equal(true),

      date()
        .lessThan(ref('$foo'))
        .isValid(valid, { context: { foo: lessThan } })
        .should.eventually()
        .equal(true),
      date()
        .lessThan(ref('$foo'))
        .isValid(invalid, { context: { foo: lessThan } })
        .should.eventually()
        .equal(false),
      date()
        .lessThan(ref('$foo'))
        .isValid(lessThan, { context: { foo: lessThan } })
        .should.eventually()
        .equal(false),
    ]);
  });

  it('should check MORETHAN correctly', () => {
    var moreThan = new Date(2014, 7, 15),
      invalid = new Date(2014, 5, 15),
      valid = new Date(2014, 9, 15);
    (function() {
      date().moreThan('hello');
    }.should.throw(TypeError));
    (function() {
      date().moreThan(ref('$foo'));
    }.should.not.throw());

    return Promise.all([
      date()
        .moreThan(moreThan)
        .isValid(valid)
        .should.eventually()
        .equal(true),
      date()
        .moreThan(moreThan)
        .isValid(invalid)
        .should.eventually()
        .equal(false),
      date()
        .moreThan(moreThan)
        .isValid(moreThan)
        .should.eventually()
        .equal(false),
      date()
        .moreThan(moreThan)
        .nullable(true)
        .isValid(null)
        .should.eventually()
        .equal(true),

      date()
        .moreThan(ref('$foo'))
        .isValid(valid, { context: { foo: moreThan } })
        .should.eventually()
        .equal(true),
      date()
        .moreThan(ref('$foo'))
        .isValid(invalid, { context: { foo: moreThan } })
        .should.eventually()
        .equal(false),
      date()
        .moreThan(ref('$foo'))
        .isValid(moreThan, { context: { foo: moreThan } })
        .should.eventually()
        .equal(false),
    ]);
  });
});
