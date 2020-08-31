export default function toArray<T>(value?: null | T | T[]) {
  return value == null ? [] : ([] as T[]).concat(value);
}
