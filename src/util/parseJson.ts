import type { AnySchema, TransformFunction } from '../types';

const parseJson: TransformFunction<any> = (value, _, schema: AnySchema<any>) => {
  if (typeof value !== 'string') {
    return value;
  }

  let parsed = value;
  try {
    parsed = JSON.parse(value);
  } catch (err) {
    /* */
  }
  return schema.isType(parsed) ? parsed : value;
};

export default parseJson;
