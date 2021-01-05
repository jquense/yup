export default function toArray<T>(value?: null | T | readonly T[]) {
  return value == null ? [] : ([] as T[]).concat(value);
}
