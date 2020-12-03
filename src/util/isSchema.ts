import type { SchemaLike } from '../types';

export default (obj: any): obj is SchemaLike => obj && obj.__isYupSchema__;
