declare module 'lodash/has' {
  function has<T extends {}, Key extends PropertyKey>(
    obj: T,
    prop: Key,
  ): obj is T & Record<Key, unknown> {
    return has(obj, prop);
  }

  export default has;
}
