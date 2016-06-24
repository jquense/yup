'use strict';

exports.__esModule = true;

var _inherits = require('./util/inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _mixed = require('./mixed');

var _mixed2 = _interopRequireDefault(_mixed);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = BooleanSchema;


function BooleanSchema() {
  var _this = this;

  if (!(this instanceof BooleanSchema)) return new BooleanSchema();

  _mixed2.default.call(this, { type: 'boolean' });

  this.withMutation(function () {
    _this.transform(function (value) {
      if (!this.isType(value)) {
        if (/^(true|1)$/i.test(value)) return true;
        if (/^(false|0)$/i.test(value)) return false;
      }
      return value;
    });
  });
}

(0, _inherits2.default)(BooleanSchema, _mixed2.default, {
  _typeCheck: function _typeCheck(v) {
    if (v instanceof Boolean) v = v.valueOf();

    return typeof v === 'boolean';
  }
});
module.exports = exports['default'];