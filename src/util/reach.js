import { forEach } from 'property-expr';
import has from 'lodash/has';

let trim = part => part.substr(0, part.length - 1).substr(1);

export function getIn(schema, path, value, context) {
  let parent, lastPart, lastPartDebug;

  // if only one "value" arg then use it for both
  context = context || value;

  forEach(path, (_part, isBracket, isArray) => {
    let part = isBracket ? trim(_part) : _part;

    if (isArray || has(schema, '_subType')) {
      // we skipped an array: foo[].bar
      let idx = isArray ? parseInt(part, 10) : 0;

      schema = schema.resolve({ context, parent, value })._subType;

      if (value) {
        if (isArray && idx >= value.length) {
          throw new Error(
            `Yup.reach cannot resolve an array item at index: ${_part}, in the path: ${path}. ` +
              `because there is no value at that index. `,
          );
        }

        value = value[idx];
      }
    }

    if (!isArray) {
      schema = schema.resolve({ context, parent, value });

      if (!has(schema, 'fields') || !has(schema.fields, part))
        throw new Error(
          `The schema does not contain the path: ${path}. ` +
            `(failed at: ${lastPartDebug} which is a type: "${schema._type}") `,
        );

      schema = schema.fields[part];

      parent = value;
      value = value && value[part];
      lastPart = _part;
      lastPartDebug = isBracket ? '[' + _part + ']' : '.' + _part;
    }
  });

  if (schema) {
    schema = schema.resolve({ context, parent, value });
  }

  return { schema, parent, parentPath: lastPart };
}

const reach = (obj, path, value, context) =>
  getIn(obj, path, value, context).schema;

export default reach;
