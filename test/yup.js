'use strict';
/*global describe, it */
var Promise = require('promise/src/es6-extensions')
  , chai  = require('chai')
  , chaiAsPromised = require('chai-as-promised')
  , reach = require('../src/util/reach')
  , BadSet = require('../src/util/set')
  , number = require('../src/number')
  , array = require('../src/array')
  , object = require('../src/object')
  , _ = require('../src/util/_');

chai.use(chaiAsPromised);

chai.should();

describe('Yup', function(){

  it('should export', function(){
    require('../lib')
  })

  it('should uniq', function(){
    _.uniq([1, 1, 2, 3, 4, 3], function(i){ return i})
      .should.eql([1, 2, 3, 4])

    _.uniq([{ a: 1}, { a: 2}, { a: 3}, { a: 1}], function(i){ return i.a})
      .should.deep.eql([{ a: 1}, { a: 2}, { a: 3}])
  })

  it('should do settled', function(){
    return Promise.all([

      _.settled([Promise.resolve('hi'), Promise.reject('error')]).should.be.fulfilled
        .then(function (results) {
          results.length.should.equal(2)
          results[0].fulfilled.should.equal(true)
          results[0].value.should.equal('hi')
          results[1].fulfilled.should.equal(false)
          results[1].value.should.equal('error')
        })
    ])
  })

  it('should merge', function(){
    var a = { a: 1, b: 'hello', c: [1, 2, 3], d: { a: /hi/ }, e: { b: 5} }

    var b = { a: 4, c: [4, 5, 3], d: { b: 'hello' }, f: { c: 5}, g: null }

    _.merge(a, b).should.deep.eql({
      a: 4,
      b: 'hello',
      c: [1, 2, 3, 4, 5, 3],
      d: {
        a: /hi/,
        b: 'hello'
      },
      e: { b: 5 },
      f: { c: 5 },
      g: null
    })
  })

  it('should REACH correctly', function(done){
    var num = number()
      , inst = object().shape({
        num: number().max(4),

        nested: object()
          .shape({
            arr: array().of(
              object().shape({ num: num })
            )
        })
      })

    reach(inst, 'nested.arr.num').should.equal(num)
    reach(inst, 'nested.arr[].num').should.equal(num)
    reach(inst, 'nested.arr[1].num').should.equal(num)
    reach(inst, 'nested["arr"][1].num').should.not.equal(number())

    reach(inst, 'nested.arr[].num').isValid(5, function (err, valid) {
      valid.should.equal(true)
      done(err)
    })
  })

  it('should REACH conditionally correctly', function(){
    var num = number()
      , inst = object().shape({
          num: number().max(4),
          nested: object()
            .shape({
              arr: array().when('$bar', function(bar) {
                return bar !== 3
                  ? array().of(number())
                  : array().of(
                    object().shape({
                      foo: number(),
                      num: number().when('foo', (foo) => {
                        if (foo === 5)
                          return num
                      })
                    })
                  )
              })
          })
        })

    let context = { bar: 3 }
    let value = {
      bar: 3,
      nested: {
        arr: [{ foo: 5 }]
      }
    }

    reach(inst, 'nested.arr.num', value).should.equal(num)
    reach(inst, 'nested.arr[].num', value).should.equal(num)

    reach(inst, 'nested.arr.num', value, context).should.equal(num)
    reach(inst, 'nested.arr[].num', value, context).should.equal(num)
    reach(inst, 'nested.arr[1].num', value, context).should.equal(num)
    reach(inst, 'nested["arr"][1].num', value, context).should.not.equal(number())

    return reach(inst, 'nested.arr[].num', value, context).isValid(5)
      .then((valid) => {
        valid.should.equal(true)
      })
  })

  describe('BadSet', function(){
    it('should preserve primitive types', function(){
      var set = new BadSet()

      set.add(2)
      set.has(2).should.be.true
      set.has('2').should.be.false
      set.values().should.eql([2])

      set.add('3')
      set.has('3').should.be.true
      set.has(3).should.be.false
      set.values().should.eql([2, '3'])

      set.add(false)
      set.has(false).should.be.true
      set.has('false').should.be.false
      set.values().should.eql([2, '3', false])

      set.add('true')
      set.has('true').should.be.true
      set.has(true).should.be.false
      set.values().should.eql([2, '3', false, 'true'])

      set.add(null)
      set.has(null).should.be.true
      set.has('null').should.be.false
      set.values().should.eql([2, '3', false, 'true', null])

      set.add(undefined)
      set.has(undefined).should.be.true
      set.has('undefined').should.be.false
      set.values().should.eql([2, '3', false, 'true', null, undefined])
    })

    it('should perform value equality for arrays and objects', function(){
      var set = new BadSet()

      var oneTwoThree = [1, '2', 3]
      set.add(oneTwoThree)
      set.has(oneTwoThree).should.be.true
      set.has([1, '2', 3]).should.be.true
      set.values().should.eql([[1, '2', 3]])
      set.length.should.equal(1)

      set.add([1, '2', 3])
      set.has(oneTwoThree).should.be.true
      set.has([1, '2', 3]).should.be.true
      set.values().should.eql([[1, '2', 3]])
      set.length.should.equal(1)

      var aOnebTwo = { a: 1, b: '2'}
      set.add(aOnebTwo)
      set.has(aOnebTwo).should.be.true
      set.has({ a: 1, b: '2'}).should.be.true
      set.values().should.eql([[1, '2', 3], { a: 1, b: '2'}])
      set.length.should.equal(2)

      set.add({ a: 1, b: '2'})
      set.has(aOnebTwo).should.be.true
      set.has({ a: 1, b: '2'}).should.be.true
      set.values().should.eql([[1, '2', 3], { a: 1, b: '2'}])
      set.length.should.equal(2)
    })

    it('should perform value equality for dates', function(){
      var set = new BadSet()

      var someDate = new Date('12-12-12')
      set.add(someDate)
      set.has(someDate).should.be.true
      set.has(new Date('12-12-12')).should.be.true
      set.values().should.eql([new Date('12-12-12')])
      set.length.should.equal(1)

      set.add(new Date('12-12-12'))
      set.has(someDate).should.be.true
      set.has(new Date('12-12-12')).should.be.true
      set.values().should.eql([new Date('12-12-12')])
      set.length.should.equal(1)
    })

    it('should not contain the same value twice', function(){
      var set = new BadSet()

      var arrayWithDuplicates = [
        1,
        2,
        3,
        '2',
        3,
        'abc',
        new Date('12-12-12'),
        4,
        new Date('12-12-12')
      ]

      arrayWithDuplicates.forEach(item => set.add(item))
      set.values().sort().should.eql(
        [1, 2, 3, '2', 'abc', new Date('12-12-12'), 4].sort())
    })

    it('should delete values', function(){
      var set = new BadSet()

      set.add(2)
      set.has(2).should.be.true
      set.length.should.equal(1)
      set.values().should.eql([2])

      set.delete('2')
      set.has(2).should.be.true
      set.length.should.equal(1)
      set.values().should.eql([2])

      set.add('3')
      set.has(2).should.be.true
      set.has('3').should.be.true
      set.length.should.equal(2)
      set.values().should.eql([2, '3'])

      set.delete('3')
      set.has(2).should.be.true
      set.has('3').should.be.false
      set.length.should.equal(1)
      set.values().should.eql([2])
    })
  })

  // it.only('should REACH with conditions', function(){
  //   var num = number()
  //   var altShape = {
  //         next: object().shape({
  //           greet: bool(),
  //           prop: number().when('greet', { is: true, then: number().max(5) })
  //         })
  //       }

  //   var inst = object().shape({
  //       num: number().max(4),
  //       nested: object()
  //         .when('num', { is: number().min(3), then: object(altShape) })
  //         .shape({
  //           next: object().shape({ prop: bool() })
  //         })
  //     })

  //   reach(inst, 'nested.arr[].num', { num: 1 }).should.equal(num)

  //   // reach(inst, 'nested.arr[1].num').should.equal(num)
  //   // reach(inst, 'nested.arr[1].num').should.not.equal(number())

  //   // reach(inst, 'nested.arr[].num').isValid(5, function(err, valid){
  //   //   valid.should.equal(true)
  //   //   done()
  //   // })
  // })

})
