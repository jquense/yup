import { forEach } from 'property-expr';

let trim = (part: string) => part.substr(0, part.length - 1).substr(1);

export function getIn<C = any>(
  schema: any,
  path: string,
  value?: any,
  context: C = value,
) {
  let parent: any, lastPart: string, lastPartDebug: string;

  // root path: ''
  if (!path) return { parent, parentPath: path, schema };

  forEach(path, (_part, isBracket, isArray) => {
    let part = isBracket ? trim(_part) : _part;

    schema = schema.resolve({ context, parent, value });

    let isTuple = schema.type === 'tuple';
    let idx = isArray ? parseInt(part, 10) : 0;

    if (schema.innerType || isTuple) {
      if (isTuple && !isArray)
        throw new Error(
          `Yup.reach cannot implicitly index into a tuple type. the path part "${lastPartDebug}" must contain an index to the tuple element, e.g. "${lastPartDebug}[0]"`,
        );
      if (value && idx >= value.length) {
        throw new Error(
          `Yup.reach cannot resolve an array item at index: ${_part}, in the path: ${path}. ` +
            `because there is no value at that index. `,
        );
      }
      parent = value;
      value = value && value[idx];
      schema = isTuple ? schema.spec.types[idx] : schema.innerType!;
    }

    // sometimes the array index part of a path doesn't exist: "nested.arr.child"
    // in these cases the current part is the next schema and should be processed
    // in this iteration. For cases where the index signature is included this
    // check will fail and we'll handle the `child` part on the next iteration like normal
    if (!isArray) {
      if (!schema.fields || !schema.fields[part])
        throw new Error(
          `The schema does not contain the path: ${path}. ` +
            `(failed at: ${lastPartDebug} which is a type: "${schema.type}")`,
        );

      parent = value;
      value = value && value[part];
      schema = schema.fields[part];
    }

    lastPart = part;
    lastPartDebug = isBracket ? '[' + _part + ']' : '.' + _part;
  });

  return { schema, parent, parentPath: lastPart! };
}

const reach = (obj: any, path: string, value?: any, context?: any) =>
  getIn(obj, path, value, context).schema;

export default reach;
