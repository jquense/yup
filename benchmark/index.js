var Suite = require('benchmark').Suite
var suite = new Suite;

global.f = require('./fixture')

suite.add('String#indexOf', {
  fn: function() {
    fixtures.schema.cast(fixtures.data)
  },
  setup: function() {
    var fixtures = f
  }
})
.on('complete', function() {
  console.log('ops/sec', this[0].hz);
})
// run async
.run({ 'async': true });
