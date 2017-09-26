/* eslint-disable no-console, import/no-extraneous-dependencies */
const { Suite } = require('benchmark');

const fixture = require('./fixture');

const suite = new Suite();

suite
  .add('schema.validate', {
    fn() {
      fixture.schema.validate(fixture.data);
    },
  })
  .add('schema.validateSync', {
    fn() {
      fixture.schema.validateSync(fixture.data);
    },
  })
  .add('schema.cast', {
    fn() {
      fixture.schema.cast(fixture.data, { sync: true });
    },
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .run({ async: true });
