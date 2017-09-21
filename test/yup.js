import reach from '../src/util/reach';
import merge from '../src/util/merge';
import { settled } from '../src/util/runValidations';

import { object, array, string, lazy, number } from '../src';

describe('Yup', function(){

  it('should export', function(){
    require('../src') // eslint-disable-line global-require
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
        .catch(err => console.log(err))
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

  it('should REACH correctly', async () => {
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

    let valid = await reach(inst, 'nested.arr[].num').isValid(5)
    valid.should.equal(true)
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

})
