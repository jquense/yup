'use strict';
/*global describe, it */
var chai  = require('chai')
  , reach = require('../lib/util/reach')
  , number = require('../lib/number')
  , array = require('../lib/array')
  , bool = require('../lib/boolean')
  , object = require('../lib/object');


chai.should();

describe('Yup', function(){

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

    reach(inst, 'nested.arr[].num').should.equal(num)
    reach(inst, 'nested.arr[1].num').should.equal(num)
    reach(inst, 'nested.arr[1].num').should.not.equal(number())

    reach(inst, 'nested.arr[].num').isValid(5, function(err, valid){
      valid.should.equal(true)
      done()
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