export default (obj: any): obj is MixedSchema => obj && obj.__isYupSchema__;
