const isAbsent = (value: any): value is undefined | null => value == null;

export default isAbsent;
