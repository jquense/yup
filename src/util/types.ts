export type Defined<T> = T extends undefined ? never : T;

export type TypedSchema = {
  __type: any;
  __outputType: any;
};

export type TypeOf<TSchema extends TypedSchema> = TSchema['__type'];

export type Asserts<TSchema extends TypedSchema> = TSchema['__outputType'];

export type Thunk<T> = T | (() => T);

export type If<T, Y, N> = T extends undefined ? Y : N;
