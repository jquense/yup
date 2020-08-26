const { SynchronousPromise } = require('synchronous-promise');

global.chai = require('chai');
global.sinon = require('sinon');

global.chai.use(require('sinon-chai'));
global.chai.use(require('chai-as-promised'));
global.chai.use(require('dirty-chai'));

global.expect = global.chai.expect;
global.chai.should();

// WTF???
Object.defineProperty(
  Promise.prototype,
  'should',
  Object.getOwnPropertyDescriptor(Object.prototype, 'should'),
);

global.TestHelpers = require('./test/helpers');

if (global.YUP_USE_SYNC) {
  const mixed = require('./src/mixed'); // eslint-disable-line global-require

  const { validate } = mixed.prototype;

  mixed.prototype.validate = function (value, options = {}, maybeCb) {
    let run = false;

    options.sync = true;

    if (maybeCb) {
      return validate.call(this, value, options, (...args) => {
        if (run) {
          return maybeCb(new Error('Did not execute synchronously'));
        }

        maybeCb(...args);
      });
    }

    const result = new SynchronousPromise((resolve, reject) => {
      validate.call(this, value, options, (err, value) => {
        if (run) {
          throw new Error('Did not execute synchronously');
        }
        if (err) reject(err);
        else resolve(value);
      });
    });

    run = true;
    return result;
  };
}
