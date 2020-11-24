import type { AnySchema } from '../types';

export default (obj: any): obj is AnySchema => obj && obj.__isYupSchema__;
