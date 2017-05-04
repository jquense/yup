require('babel-polyfill')
global.chai = require('chai')
global.sinon = require('sinon')


global.chai.use(require('sinon-chai'))
global.chai.use(require('chai-as-promised'))
global.chai.use(require('dirty-chai'))

global.chai.should();

global.expect = window.expect = global.chai.expect;
global.TestHelpers = window.TestHelpers = require('./test/helpers');

global.specify = global.it