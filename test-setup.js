const { SynchronousPromise } = require('synchronous-promise');

global.TestHelpers = require('./test/helpers');

if (global.YUP_USE_SYNC) {
  const { Schema } = require('./src'); // eslint-disable-line global-require

  const { validateSync } = Schema.prototype;

  Schema.prototype.validate = function (value, options = {}) {
    return new SynchronousPromise((resolve, reject) => {
      let result;
      try {
        result = validateSync.call(this, value, options);
      } catch (err) {
        reject(err);
      }

      resolve(result);
    });
  };
}
