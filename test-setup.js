// require('babel-polyfill')

global.chai = require('chai')
global.sinon = require('sinon')

global.chai.use(require('sinon-chai'))
global.chai.use(require('chai-as-promised'))
global.chai.use(require('dirty-chai'))

global.expect = global.chai.expect;
global.chai.should();

// WTF???
Object.defineProperty(
  Promise.prototype,
  'should',
  Object.getOwnPropertyDescriptor(Object.prototype, 'should')
);

global.TestHelpers = require('./test/helpers');

global.specify = global.it
