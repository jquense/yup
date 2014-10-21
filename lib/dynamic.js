'use strict';
var SchemaObject = require('./mixed')
  , locale = require('./locale.js').object
  , _ = require('lodash')
  , getter = require('property-expr').getter

var _Dynamic = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Dynamic))
      return new _Dynamic()

    this._matches = {};

    SchemaObject.call(this)

    this._type = 'dynamic'
  },

  _coerce: function(value){
    var match = this._findMatch(value);

    return match 
      ? match.schema.cast(value)
      : null
  },

  _validate: function(value, _opts, _state){
    var matches = this._findMatch(value, _opts, _state)

    if( matches.errors.length)
      this.errors = this.errors.concat(matches.errors)

    return !!matches.schema
  },

  _findMatch: function(value, options, state){
    var errors = [], result;

    result =  _.find(this._matches, function(match){
      var schema = match.schema;

      if(schema._validate(value, options, state))
        return true

      errors = [].concat(schema.errors)
    })

    return {
      schema: result && result.schema,
      errors: errors
    }
  },

  any: function(args){
    var next = this.clone()
      , opts = [].concat(args);

    next.matches = [].concat(
      next._matches, _.map(opts, function(schema){
        return { schema: schema }
      }))

    return next
  }

})