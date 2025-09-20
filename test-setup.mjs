import { beforeAll } from 'vitest';
import { SynchronousPromise } from 'synchronous-promise';
import * as yup from './src/index.ts';

beforeAll(() => {
  if (global.YUP_USE_SYNC) {
    const { Schema } = yup;
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
});
