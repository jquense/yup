import mapValues from 'lodash/mapValues';
import ValidationError from '../ValidationError';
import Ref from '../Reference';
import { SynchronousPromise } from 'synchronous-promise';

let formatError = ValidationError.formatError;

let thenable = p =>
  p && typeof p.then === 'function' && typeof p.catch === 'function';

function runTest(testFn, ctx, value, sync) {
  let result = testFn.call(ctx, value, ctx);
  if (!sync) return Promise.resolve(result);

  if (thenable(result)) {
    throw new Error(
      `Validation test of type: "${
      ctx.type
      }" returned a Promise during a synchronous validate. ` +
      `This test will finish after the validate call has returned`,
    );
  }
  return SynchronousPromise.resolve(result);
}

function resolveParams(oldParams, newParams, resolve) {
  return mapValues({ ...oldParams, ...newParams }, resolve);
}

export function createErrorFactory({
  value,
  label,
  resolve,
  originalValue,
  ...opts
}) {
  return function createError({
    path = opts.path,
    message = opts.message,
    type = opts.name,
    params,
  } = {}) {
    params = {
      path,
      value,
      originalValue,
      label,
      ...resolveParams(opts.params, params, resolve),
    };

    return Object.assign(
      new ValidationError(formatError(message, params), value, path, type),
      { params },
    );
  };
}

export default function createValidation(options) {
  let { name, message, test, params } = options;

  function validate({
    value,
    path,
    label,
    options,
    originalValue,
    sync,
    ...rest
  }) {
    let parent = options.parent;
    let resolve = item =>
      Ref.isRef(item)
        ? item.getValue({ value, parent, context: options.context })
        : item;

    let createError = createErrorFactory({
      message,
      path,
      value,
      originalValue,
      params,
      label,
      resolve,
      name,
    });

    let ctx = {
      path,
      parent,
      type: name,
      createError,
      resolve,
      options,
      originalValue,
      ...rest,
    };

    return runTest(test, ctx, value, sync).then(validOrError => {
      if (ValidationError.isError(validOrError)) throw validOrError;
      else if (!validOrError) throw createError();
    });
  }

  validate.OPTIONS = options;

  return validate;
}
