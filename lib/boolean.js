'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var MixedSchema = require('./mixed'),
    inherits = require('./util/_').inherits;

module.exports = BooleanSchema;

function BooleanSchema() {
  var _this = this;

  if (!(this instanceof BooleanSchema)) return new BooleanSchema();

  MixedSchema.call(this, { type: 'boolean' });

  this.withMutation(function () {
    _this.transform(function (value) {
      if (this.isType(value)) return value;
      return (/true|1/i.test(value)
      );
    });
  });
}

inherits(BooleanSchema, MixedSchema, {
  _typeCheck: function _typeCheck(v) {
    return typeof v === 'boolean' || (typeof v === 'undefined' ? 'undefined' : _typeof(v)) === 'object' && v instanceof Boolean;
  }
});