import type { ISchema } from '../types';

const isSchema = (obj: any): obj is ISchema<any> => obj && obj.__isYupSchema__;

export default isSchema;
