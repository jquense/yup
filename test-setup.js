/* global window:false */
require('babel-polyfill');
global.chai = require('chai');
global.sinon = require('sinon');

global.chai.use(require('sinon-chai'));
global.chai.use(require('chai-as-promised'));
global.chai.use(require('dirty-chai'));

global.chai.should();

global.expect = global.chai.expect;
window.expect = global.expect;

global.TestHelpers = require('./test/helpers');

window.TestHelpers = global.TestHelpers;

global.specify = global.it;
