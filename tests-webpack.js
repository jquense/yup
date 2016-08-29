require('babel-polyfill')


global.chai.use(require('dirty-chai'))
global.chai.use(require('chai-as-promised'))

global.chai.should();

global.expect = window.expect = global.chai.expect;
global.TestHelpers = window.TestHelpers = require('./test/helpers');

var testsContext = require.context('./test', true);

testsContext.keys().forEach(testsContext);
