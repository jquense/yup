export const isRelativePath = path =>
  typeof path === 'string' && path.indexOf('../') === 0;

function getParentPath(path) {
  let objectIndex = path.lastIndexOf('.');
  return path.substring(0, objectIndex);
}
export function getRelativePath(path, key) {
  if (!path) return key;
  //relative paths using '../' always start from the parent of the current path (the object the path is in)
  path = getParentPath(path);
  if (isRelativePath(key)) {
    // remove '../' from the beginning of the key
    key = key.slice(3);
    return getRelativePath(path, key);
  } else {
    return makePath`${path}.${key}`;
  }
}

export default function makePath(strings, ...values) {
  let path = strings.reduce((str, next) => {
    let value = values.shift();
    return str + (value == null ? '' : value) + next;
  });

  return path.replace(/^\./, '');
}
