import { forEach } from 'property-expr';
import { AnySchema } from '..';
import type ArraySchema from '../array';
import type { ISchema } from '../types';

let trim = (part: string) => part.substr(0, part.length - 1).substr(1);

let isInnerTypeChema = (
  schema: AnySchema<any, any>,
): schema is ArraySchema<any, any, any, any> =>
  'innerType' in schema && schema.type === 'array';

export function getIn<C = any>(
  schema: ISchema<any, C>,
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

    if (schema.innerType) {
      let idx = isArray ? parseInt(part, 10) : 0;

      if (value && idx >= value.length) {
        throw new Error(
          `Yup.reach cannot resolve an array item at index: ${_part}, in the path: ${path}. ` +
            `because there is no value at that index. `,
        );
      }
      parent = value;
      value = value && value[idx];
      schema = schema.innerType;
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

const reach = (obj: {}, path: string, value?: any, context?: any) =>
  getIn(obj, path, value, context).schema;

export default reach;
