export default function makePath(strings, ...values) {
  let path = strings.reduce((str, next) => {
    let value = values.shift();
    return str + (value == null ? '' : value) + next;
  });

  return path.replace(/^\./, '');
}
