
export default function makePath(strings, ...values) {
  const path = strings.reduce((str, next) => {
    const value = values.shift();
    return str + (value == null ? '' : value) + next;
  });

  return path.replace(/^\./, '');
}
