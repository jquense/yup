'use strict';
require('babel-polyfill')

var chai = require('chai')

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

chai.should();

global.expect = window.expect = chai.expect;
global.TestHelpers = window.TestHelpers = require('./test/helpers');

var testsContext = require.context('./test', true);

testsContext.keys().forEach(testsContext);
