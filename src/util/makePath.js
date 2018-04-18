export const isRelativePath = path =>
  typeof path === 'string' && path.indexOf('../') === 0;

function getParentPath(path) {
  const endsWithDot = path[path.length - 1] === '.';
  if (endsWithDot) {
    //remove the dot --- don't worry we add it back after removing the last path section
    path = path.slice(0, -1);
  }
  let objectIndex = path.lastIndexOf('.');
  path = path.substring(0, objectIndex);
  if (endsWithDot) {
    //add the dot back if it started with a dot
    path += '.';
  }
  return path;
}
function getRelativePath(path, key) {
  // remove '../' from the beginning of the key
  key = key.slice(3);
  path = getParentPath(path);
  if (isRelativePath(key)) {
    return getRelativePath(path, key);
  }
  return { path, key };
}
export default function makePath(strings, ...values) {
  let path = strings.reduce((str, next) => {
    let value = values.shift();
    if (isRelativePath(value)) {
      //relative paths using '../' always start from the parent of the current path (the object the path is in)
      const parentPath = getParentPath(str);
      const { path, key } = getRelativePath(parentPath, value);
      str = path;
      value = key;
    }
    return str + (value == null ? '' : value) + next;
  });

  return path.replace(/^\./, '');
}
