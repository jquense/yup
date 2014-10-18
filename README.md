Miniature
=======================

a js object schema validation. The api and style is definately inspired by/stolen from [Joi](https://github.com/hapijs/joi) which is an amazing library but generally too big and feature rich for my browser validation needs. Miniature is a lean lib in the same spirit without the fancy features. You can use it on the server as well, but in that case you might as well just use Joi.

## Usage

You define and create schema objects 
  
    var mini = require('miniature')

    var schema = mini.object().shape({
      name:      mini.string().required(),
      age:       mini.number().required().positive().integer(),
      email:     mini.string().email(),
      website    mini.string().url(),
      createdOn: mini.date().default(function() { 
        return new Date 
      }),
    })

    //check validity
    schema.isValid({
      name: 'jimmy',
      age: 24
    })  
    // => true

    //you can try and type cast objects to the defined schema
    schema.cast({
      name: 'jimmy',
      age: '24',
      createdOn: '2014-09-23T19:25:25Z'
    })
    // => { name: 'jimmy', age: 24, createdOn: Date }

