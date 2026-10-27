// Keep the cast resolver off the parent object and public options.
const siblingResolvers = new WeakMap<object, (path: string) => void>();

export default siblingResolvers;
