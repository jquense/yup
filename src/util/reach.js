import { forEach } from 'property-expr';
import has from 'lodash/has';

let trim = part => part.substr(0, part.length - 1).substr(1);

export default function reach(obj, path, fieldValue, context, value) {
  let parent, lastPart;

  // if only one "value" arg then use it for both
  context = context || fieldValue;

  forEach(path, (_part, isBracket, isArray) => {
    let part = isBracket ? trim(_part) : _part;

    if (isArray || has(obj, '_subType')) {
      // we skipped an array: foo[].bar
      let idx = isArray ? parseInt(part, 10) : 0;
      obj = obj.resolve({ context, parent, fieldValue, value })._subType;

      if (fieldValue) {
        if (isArray && idx >= fieldValue.length) {
          throw new Error(
            `Yup.reach cannot resolve an array item at index: ${_part}, in the path: ${path}. ` +
              `because there is no value at that index. `,
          );
        }

        fieldValue = fieldValue[idx];
      }
    }

    if (!isArray) {
      obj = obj.resolve({ context, parent, fieldValue, value });

      if (!has(obj, 'fields') || !has(obj.fields, part))
        throw new Error(
          `The schema does not contain the path: ${path}. ` +
            `(failed at: ${lastPart} which is a type: "${obj._type}") `,
        );

      obj = obj.fields[part];

      parent = fieldValue;
      fieldValue = fieldValue && fieldValue[part];
      lastPart = isBracket ? '[' + _part + ']' : '.' + _part;
    }
  });

  if (obj) {
    obj = obj.resolve({ context, parent, fieldValue, value, path });
  }

  return obj;
}
