import { Callback } from '../types';

export function asCallback(promise: Promise<any>, callback: Callback) {
  promise.then((result) => callback(null, result), callback);
}

export const once = <T extends (...args: any[]) => any>(cb: T) => {
  let fired = false;
  return (...args: Parameters<T>) => {
    if (fired) return;
    fired = true;
    cb(...args);
  };
};
