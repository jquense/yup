import Promise from 'promise/src/es6-extensions';
import reach from '../src/util/reach';
import BadSet from '../src/util/set';
import merge from '../src/util/merge';
import { settled } from '../src/util/runValidations';

import { object, array, string, lazy, number } from '../src';

describe('Yup', function(){

  it('should export', function(){
    require('../lib') // eslint-disable-line global-require
  })

  it('cast should not assert on undefined', () => {
    (() => string().cast(undefined))
      .should.not.throw()
  })

  it('cast should assert on undefined cast results', () => {
    (() => string().transform(() => undefined).cast('foo'))
      .should.throw()
  })

  it('cast should respect assert option', () => {
    (() => string().cast(null))
      .should.throw();

    (() => string().cast(null, { assert: false }))
      .should.not.throw()
  })

  it('should do settled', function(){
    return Promise.all([

      settled([Promise.resolve('hi'), Promise.reject('error')])
        .should.be.fulfilled()
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

    merge(a, b).should.deep.eql({
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
        arr: [{ foo: 5 }, { foo: 3 }]
      }
    }

    reach(inst, 'nested.arr.num', value).should.equal(num)
    reach(inst, 'nested.arr[].num', value).should.equal(num)

    reach(inst, 'nested.arr.num', value, context).should.equal(num)
    reach(inst, 'nested.arr[].num', value, context).should.equal(num)
    reach(inst, 'nested.arr[0].num', value, context).should.equal(num)

    // should fail b/c item[1] is used to resolve the schema
    reach(inst, 'nested["arr"][1].num', value, context).should.not.equal(num)

    return reach(inst, 'nested.arr[].num', value, context).isValid(5)
      .then((valid) => {
        valid.should.equal(true)
      })
  })

  it('should reach through lazy', async () => {
    let types = {
      '1': object({ foo: string() }),
      '2': object({ foo: number() })
    }

    let err = await object({
      x: array(
        lazy(val => types[val.type])
      )
    })
    .strict()
    .validate({ x: [
      { type: 1, foo: '4' },
      { type: 2, foo: '5' }
    ]})
    .should.be.rejected()
    err.message.should.match(/must be a `number` type/)
  })

  describe('BadSet', function(){
    it('should preserve primitive types', function(){
      var set = new BadSet()

      set.add(2)
      set.has(2).should.be.true()
      set.has('2').should.be.false()
      set.values().should.eql([2])

      set.add('3')
      set.has('3').should.be.true()
      set.has(3).should.be.false()
      set.values().should.eql([2, '3'])

      set.add(false)
      set.has(false).should.be.true()
      set.has('false').should.be.false()
      set.values().should.eql([2, '3', false])

      set.add('true')
      set.has('true').should.be.true()
      set.has(true).should.be.false()
      set.values().should.eql([2, '3', false, 'true'])

      set.add(null)
      set.has(null).should.be.true()
      set.has('null').should.be.false()
      set.values().should.eql([2, '3', false, 'true', null])

      set.add(undefined)
      set.has(undefined).should.be.true()
      set.has('undefined').should.be.false()
      set.values().should.eql([2, '3', false, 'true', null, undefined])
    })

    it('should perform value equality for arrays and objects', function(){
      var set = new BadSet()

      var oneTwoThree = [1, '2', 3]
      set.add(oneTwoThree)
      set.has(oneTwoThree).should.be.true()
      set.has([1, '2', 3]).should.be.true()
      set.values().should.eql([[1, '2', 3]])
      set.length.should.equal(1)

      set.add([1, '2', 3])
      set.has(oneTwoThree).should.be.true()
      set.has([1, '2', 3]).should.be.true()
      set.values().should.eql([[1, '2', 3]])
      set.length.should.equal(1)

      var aOnebTwo = { a: 1, b: '2'}
      set.add(aOnebTwo)
      set.has(aOnebTwo).should.be.true()
      set.has({ a: 1, b: '2'}).should.be.true()
      set.values().should.eql([[1, '2', 3], { a: 1, b: '2'}])
      set.length.should.equal(2)

      set.add({ a: 1, b: '2'})
      set.has(aOnebTwo).should.be.true()
      set.has({ a: 1, b: '2'}).should.be.true()
      set.values().should.eql([[1, '2', 3], { a: 1, b: '2'}])
      set.length.should.equal(2)
    })

    it('should perform value equality for dates', function(){
      var set = new BadSet()

      var someDate = new Date('12-12-12')
      set.add(someDate)
      set.has(someDate).should.be.true()
      set.has(new Date('12-12-12')).should.be.true()
      set.values().should.eql([new Date('12-12-12')])
      set.length.should.equal(1)

      set.add(new Date('12-12-12'))
      set.has(someDate).should.be.true()
      set.has(new Date('12-12-12')).should.be.true()
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
      set.has(2).should.be.true()
      set.length.should.equal(1)
      set.values().should.eql([2])

      set.delete('2')
      set.has(2).should.be.true()
      set.length.should.equal(1)
      set.values().should.eql([2])

      set.add('3')
      set.has(2).should.be.true()
      set.has('3').should.be.true()
      set.length.should.equal(2)
      set.values().should.eql([2, '3'])

      set.delete('3')
      set.has(2).should.be.true()
      set.has('3').should.be.false()
      set.length.should.equal(1)
      set.values().should.eql([2])
    })
  })
})
