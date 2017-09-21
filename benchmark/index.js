/* eslint-disable no-console, import/no-extraneous-dependencies */
const { Suite } = require('benchmark');

const fixture = require('./fixture');

const suite = new Suite();

suite
  .add('schema.cast', {
    fn() {
      fixture.schema.cast(fixture.data);
    },
  })
  .on('complete', function complete() {
    console.log('ops/sec', this[0].hz);
  })
  .run({ async: true });
