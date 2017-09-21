let dict = {};

export function setLocale(custom) {
  dict = { ...dict, ...custom };
  return dict;
}

export function getLocale() {
  return dict;
}
