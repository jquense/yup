import Schema from '../Schema';

export default (obj: any): obj is Schema => obj && obj.__isYupSchema__;
