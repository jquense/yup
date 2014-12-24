'use strict';
/*global describe, it */
var chai  = require('chai')
  , reach = require('../dist/util/reach')
  , number = require('../dist/number')
  , array = require('../dist/array')
  , object = require('../dist/object');


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
  
})