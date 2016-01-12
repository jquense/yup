'use strict';
/*global describe, it */
var chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , ValidationError = require('../src/util/validation-error')
  , Promise = require('promise/src/es6-extensions')
  , mixed = require('../src/mixed')
  , object = require('../src/object')
  , string = require('../src/string')
  , reach = require('../src/util/reach');

chai.use(chaiAsPromised);
chai.should();

describe( 'Mixed Types ', function(){

  it('should be immutable', function(){
    var inst = mixed(), next;
    var sub = inst.sub = mixed()

    inst.should.not.equal(next = inst.required())

    next.sub.should.equal(sub)
    inst.sub.should.equal(next.sub)

    inst.should.be.an.instanceOf(mixed)
    next.should.be.an.instanceOf(mixed)

    return Promise.all([
      inst.isValid().should.eventually.equal(true),
      next.isValid().should.eventually.equal(false)
    ])
  })

  it('cast should return a default is empty', function(){
    var inst = mixed().default('hello')

    return inst.cast().should.equal('hello')
  })

  it('should limit values', function(){
    var inst = mixed().oneOf(['hello', 5])

    return Promise.all([
      inst.isValid(5).should.eventually.equal(true),
      inst.isValid('hello').should.eventually.equal(true),

      inst.validate(6).should.be.rejected.then(function(err) {
        err.errors[0].should.equal('this must be one the following values: hello, 5')
      })
    ])
  })

  it('should exclude values', function(){
    var inst = mixed().notOneOf(['hello', 5])

    return Promise.all([
      inst.isValid(6).should.eventually.equal(true),
      inst.isValid('hfhfh').should.eventually.equal(true),

      inst.isValid(5).should.eventually.equal(false),

      inst.validate(5).should.be.rejected.then(function(err){
        err.errors[0].should.equal('this must not be one the following values: hello, 5')
      }),

      inst.oneOf([5]).isValid(5).should.eventually.equal(true)
    ])
  })

  it('should respect strict', function(){
    var inst = string().equals(['hello', '5'])

    return Promise.all([
      inst.isValid(5).should.eventually.equal(true),
      inst.strict().isValid(5).should.eventually.equal(false)
    ])
  })

  it('should respect abortEarly', function(){
    var inst = string().trim().min(10)

    return Promise.all([

      inst.strict().validate(' hi ').should.be.rejected
        .then(function(err){
          err.errors.length.should.equal(1)
        }),

      inst.strict().validate(' hi ', { abortEarly: false }).should.be.rejected
        .then(function(err){
          err.errors.length.should.equal(2)
        })
    ])
  })

  it('should respect exclusive validation', function(){
    var inst = mixed()
      .test({ message: 'invalid', exclusive: true, name: 'test', test:  function(){} })
      .test({ message: 'also invalid', name: 'test', test:  function(){} })

    inst.tests.length.should.equal(1)

    inst = mixed()
      .test({ message: 'invalid', name: 'test', test:  function(){} })
      .test({ message: 'also invalid', name: 'test', test:  function(){} })

    inst.tests.length.should.equal(2)
  })

  it('exclusive tests should throw without a name', function(){
    (function(){
      mixed().test({ message: 'invalid', exclusive: true, test: function(){} })
    }).should.throw()
  })

  it('exclusive tests should replace previous ones', function(){
    var inst = mixed().test({ message: 'invalid', exclusive: true, name: 'max', test: function(v){
      return v < 5
    }})

    return Promise.all([

      inst.isValid(8).should.eventually.become(false),

      inst.test({ message: 'invalid', exclusive: true, name: 'max', test: function(v){
          return v < 10
        }})
        .isValid(8).should.eventually.become(true)
    ])
  })

  it('tests should be called with the correct `this`', function(done){
    var inst = object({
      other: mixed(),
      test: mixed().test({
        message: 'invalid',
        exclusive: true,
        name: 'max',
        test: function(){
          this.path.should.equal('test')
          this.parent.should.eql({ other: 5, test : 'hi' })
          this.options.context.should.eql({ user: 'jason' })
          done()
        }
      })
    })

    inst.validate({ other: 5, test : 'hi' }, { context: { user: 'jason' } })
  })

  it('tests can return an error', function(){
    var inst = mixed().test({
        message: 'invalid ${path}',
        name: 'max',
        test: function(){
          return this.createError({ path: 'my.path' })
        }
      })

    return inst.validate('')
      .should.be.rejected
      .then(function(e){
        e.path.should.equal('my.path')
        e.errors[0].should.equal('invalid my.path')
      })
  })

  it('should use returned error path and message', function(){
    var inst = mixed().test({
        message: 'invalid ${path}',
        name: 'max',
        test: function(){
          return this.createError({ message: '${path} nope!', path: 'my.path' })
        }
      })

    return inst.validate({ other: 5, test : 'hi' })
      .should.be.rejected
      .then(function(e){
        e.path.should.equal('my.path')
        e.errors[0].should.equal('my.path nope!')
      })
  })

  it('should allow custom validation of either style', function(){
    var inst = string()
      .test('name', 'test a', function(val){
        return Promise.resolve(val === 'jim')
      })
      .test('name', 'test b', function(val, done){
        process.nextTick(function(){
          done(null, val !== 'jim')
        })
      }, true)

    return Promise.all([
      inst.validate('jim').should.be.rejected.then(function(e){
        e.errors[0].should.equal('test b')
      }),
      inst.validate('joe').should.be.rejected.then(function(e){
        e.errors[0].should.equal('test a')
      })
    ])
  })

  it('should respect callback interfaces', function(done){
    var inst = string().oneOf(['hello', '5'])

    inst.isValid(5, function(err, valid){
      valid.should.equal(true)
      chai.expect(err).to.equal(null)

      inst.strict().validate(5, function(err, value){
        err.should.be.an.instanceOf(ValidationError)
        chai.expect(value).to.equal(undefined)
        done()
      })
    })
  })

  it('should concat schemas', function(){
    var inst = object({
      str: string().required(),
      obj: object({
        str: string()
      })
    })

    var next = inst.concat(object({
      str: string().required().trim(),
      str2: string().required(),
      obj: object({
        str: string().required()
      })
    }))

    reach(next, 'str').tests.length.should.equal(3) // presence, min and trim
    reach(next, 'str').tests[0].VALIDATION_KEY.should.equal('required') // make sure they are in the right order

    return Promise.all([

      inst.isValid({ str: 'hi', str2: 'hi', obj: {} }).should.become(true),

      next.validate({ str: ' hi  ', str2: 'hi', obj: { str: 'hi' } }).should.be.fulfilled.then(function(value){
        value.should.deep.eql({ str: 'hi', str2: 'hi', obj: {str: 'hi'} })
      }),

      next.validate({ str: 'hi', str2: 'hi', obj: {} }).should.be.rejected.then(function(err){
        err.message.should.contain('obj.str is a required field')
      }),

      next.validate({ str2: 'hi', obj: { str: 'hi'} }).should.be.rejected.then(function(err){
        err.message.should.contain('str is a required field')
      })
    ])

  })

  it('concat should fail on different types', function(){
    var inst = string().default('hi');

    (function(){
      inst.concat(object())
    }).should.throw(TypeError)
  })

  it('concat should allow mixed and other type', function(){
    var inst = mixed().default('hi');

    (function(){
      inst.concat(string())._type.should.equal('string')

    }).should.not.throw(TypeError)
  })

  it('concat should maintain undefined defaults', function(){
    var inst = string().default('hi')

    chai.expect(
      inst.concat(string().default(undefined)).default()).to.equal(undefined)
  })

  it('defaults should be validated but not transformed', function(){
    var inst = string().trim().default('  hi  ')

    return inst.validate(undefined).should.be.rejected
      .then(function(err){
        err.message.should.equal('this must be a trimmed string')
      })
  })

  it('should handle conditionals', function(){
    var inst = mixed()
      .when('prop', { is: 5, then: mixed().required('from parent') })

    return Promise.all([
      //parent
      inst._validate(undefined, {}, { parent: { prop: 5 }}).should.be.rejected,
      inst._validate(undefined, {}, { parent: { prop: 1 }}).should.be.fulfilled,
      inst._validate('hello', {},   { parent: { prop: 5 }}).should.be.fulfilled
    ])
    .then(function(){

      inst = string().when('prop', {
        is:        function(val) { return val === 5 },
        then:      string().required(),
        otherwise: string().min(4)
      })

      return Promise.all([
        inst._validate(undefined, {}, { parent: { prop: 5 }}).should.be.rejected,
        inst._validate('hello', {}, { parent: { prop: 1 }}).should.be.fulfilled,
        inst._validate('hel', {}, { parent: { prop: 1 }}).should.be.rejected
      ])
    })
  })

  it('should require context when needed', function(){
    var inst = mixed()
      .when('$prop', { is: 5, then: mixed().required('from context') })

    return Promise.all([
      inst._validate(undefined, { context: { prop: 5 }}, {}).should.be.rejected,
      inst._validate(undefined, { context: { prop: 1 }}, {}).should.be.fulfilled,
      inst._validate('hello',   { context: { prop: 5 }}, {}).should.be.fulfilled
    ])
    .then(function(){
      inst = string().when('$prop', {
        is:        function(val) { return val === 5 },
        then:      string().required(),
        otherwise: string().min(4)
      })

      return Promise.all([
        inst._validate(undefined, { context: { prop: 5 }}, {}).should.be.rejected,
        inst._validate('hello', { context: { prop: 1 }}, {}).should.be.fulfilled,
        inst._validate('hel', { context: { prop: 1 }}, {}).should.be.rejected
      ])
    })
  })

  it('should not use context refs in object calculations', function(){
    var inst = object({
      prop: string().when('$prop', { is: 5, then: string().required('from context') })
    })

    inst.default().should.eql({ prop: undefined })
  })

})
