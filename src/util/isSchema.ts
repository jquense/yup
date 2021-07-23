import type { SchemaLike } from '../types';

const isSchema = (obj: any): obj is SchemaLike => obj && obj.__isYupSchema__;

export default isSchema
