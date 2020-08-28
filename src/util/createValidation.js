import mapValues from 'lodash/mapValues';
import ValidationError from '../ValidationError';
import Ref from '../Reference';

export default function createValidation(config) {
  function validate(
    { value, path, label, options, originalValue, sync, ...rest },
    cb,
  ) {
    const { name, test, params, message } = config;
    let { parent, context } = options;

    function resolve(item) {
      return Ref.isRef(item) ? item.getValue(value, parent, context) : item;
    }

    function createError(overrides = {}) {
      const nextParams = mapValues(
        {
          value,
          originalValue,
          label,
          path: overrides.path || path,
          ...params,
          ...overrides.params,
        },
        resolve,
      );

      const error = new ValidationError(
        ValidationError.formatError(overrides.message || message, nextParams),
        value,
        nextParams.path,
        overrides.type || name,
      );
      error.params = nextParams;
      return error;
    }

    let ctx = {
      path,
      parent,
      type: name,
      createError,
      resolve,
      options,
      ...rest,
    };

    if (!sync) {
      try {
        Promise.resolve(test.call(ctx, value)).then((validOrError) => {
          if (ValidationError.isError(validOrError)) cb(validOrError);
          else if (!validOrError) cb(createError());
          else cb(null, validOrError);
        });
      } catch (err) {
        cb(err);
      }

      return;
    }

    let result;
    try {
      result = test.call(ctx, value);

      if (typeof result?.then === 'function') {
        throw new Error(
          `Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. ` +
            `This test will finish after the validate call has returned`,
        );
      }
    } catch (err) {
      cb(err);
      return;
    }

    if (ValidationError.isError(result)) cb(result);
    else if (!result) cb(createError());
    else cb(null, result);
  }

  validate.OPTIONS = config;

  return validate;
}
