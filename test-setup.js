const { SynchronousPromise } = require('synchronous-promise');

global.TestHelpers = require('./test/helpers');

if (global.YUP_USE_SYNC) {
  const { BaseSchema } = require('./src'); // eslint-disable-line global-require

  const { validate } = BaseSchema.prototype;

  BaseSchema.prototype.validate = function (value, options = {}, maybeCb) {
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
