import { SynchronousPromise } from 'synchronous-promise';

export default function getPromise(sync = false) {
  return sync ? SynchronousPromise : Promise;
}
