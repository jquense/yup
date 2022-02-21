import reach, { getIn } from '../src/util/reach';

import {
  addMethod,
  object,
  array,
  string,
  lazy,
  number,
  boolean,
  date,
  Schema,
  ObjectSchema,
  ArraySchema,
  StringSchema,
  NumberSchema,
  BooleanSchema,
  DateSchema,
  mixed,
  MixedSchema,
  tuple,
} from '../src';

describe('Yup', function () {
  it('cast should not assert on undefined', () => {
    expect(() => string().cast(undefined)).not.toThrowError();
  });

  it('cast should assert on undefined cast results', () => {
    expect(() =>
      string()
        .defined()
        .transform(() => undefined)
        .cast('foo'),
    ).toThrowError(
      'The value of field could not be cast to a value that satisfies the schema type: "string".',
    );
  });

  it('cast should respect assert option', () => {
    expect(() => string().cast(null)).toThrowError();

    expect(() => string().cast(null, { assert: false })).not.toThrowError();
  });

  it('should getIn correctly', async () => {
    let num = number();
    let shape = object({ 'num-1': num });
    let inst = object({
      num: number().max(4),

      nested: object({
        arr: array().of(shape),
      }),
    });

    const value = { nested: { arr: [{}, { 'num-1': 2 }] } };
    let { schema, parent, parentPath } = getIn(
      inst,
      'nested.arr[1].num-1',
      value,
    );

    expect(schema).toBe(num);
    expect(parentPath).toBe('num-1');
    expect(parent).toBe(value.nested.arr[1]);
  });

  it('should getIn array correctly', async () => {
    let num = number();
    let shape = object({ 'num-1': num });
    let inst = object({
      num: number().max(4),

      nested: object({
        arr: array().of(shape),
      }),
    });

    const value = {
      nested: {
        arr: [{}, { 'num-1': 2 }],
      },
    };

    const { schema, parent, parentPath } = getIn(inst, 'nested.arr[1]', value);

    expect(schema).toBe(shape);
    expect(parentPath).toBe('1');
    expect(parent).toBe(value.nested.arr);
  });

  it('should REACH correctly', async () => {
    let num = number();
    let shape = object({ num });

    let inst = object({
      num: number().max(4),

      nested: tuple([
        string(),
        object({
          arr: array().of(shape),
        }),
      ]),
    });

    expect(reach(inst, '')).toBe(inst);

    expect(reach(inst, 'nested[1].arr[0].num')).toBe(num);
    expect(reach(inst, 'nested[1].arr[].num')).toBe(num);
    expect(reach(inst, 'nested[1].arr.num')).toBe(num);
    expect(reach(inst, 'nested[1].arr[1].num')).toBe(num);
    expect(reach(inst, 'nested[1].arr[1]')).toBe(shape);

    expect(() => reach(inst, 'nested.arr[1].num')).toThrowError(
      'Yup.reach cannot implicitly index into a tuple type. the path part ".nested" must contain an index to the tuple element, e.g. ".nested[0]"',
    );

    expect(reach(inst, 'nested[1].arr[0].num').isValid(5)).resolves.toBe(true);
  });

  it('should REACH conditionally correctly', async function () {
    let num = number().oneOf([4]),
      inst = object().shape({
        num: number().max(4),
        nested: object().shape({
          arr: array().when('$bar', function ([bar]) {
            return bar !== 3
              ? array().of(number())
              : array().of(
                  object().shape({
                    foo: number(),
                    num: number().when('foo', ([foo]) => {
                      if (foo === 5) return num;
                    }),
                  }),
                );
          }),
        }),
      });

    let context = { bar: 3 };
    let value = {
      bar: 3,
      nested: {
        arr: [{ foo: 5 }, { foo: 3 }],
      },
    };

    let options = {};
    options.parent = value.nested.arr[0];
    options.value = options.parent.num;
    expect(reach(inst, 'nested.arr.num', value).resolve(options)).toBe(num);
    expect(reach(inst, 'nested.arr[].num', value).resolve(options)).toBe(num);

    options.context = context;
    expect(reach(inst, 'nested.arr.num', value, context).resolve(options)).toBe(
      num,
    );
    expect(
      reach(inst, 'nested.arr[].num', value, context).resolve(options),
    ).toBe(num);
    expect(
      reach(inst, 'nested.arr[0].num', value, context).resolve(options),
    ).toBe(num);

    // // should fail b/c item[1] is used to resolve the schema
    options.parent = value.nested.arr[1];
    options.value = options.parent.num;
    expect(
      reach(inst, 'nested["arr"][1].num', value, context).resolve(options),
    ).not.toBe(num);

    let reached = reach(inst, 'nested.arr[].num', value, context);

    await expect(
      reached.validate(5, { context, parent: { foo: 4 } }),
    ).resolves.toBeDefined();

    await expect(
      reached.validate(5, { context, parent: { foo: 5 } }),
    ).rejects.toThrowError(/one of the following/);
  });

  it('should reach through lazy', async () => {
    let types = {
      1: object({ foo: string() }),
      2: object({ foo: number() }),
    };

    await expect(
      object({
        x: array(lazy((val) => types[val.type])),
      })
        .strict()
        .validate({
          x: [
            { type: 1, foo: '4' },
            { type: 2, foo: '5' },
          ],
        }),
    ).rejects.toThrowError(/must be a `number` type/);
  });

  describe('addMethod', () => {
    it('extending Schema should make method accessible everywhere', () => {
      addMethod(Schema, 'foo', () => 'here');

      expect(string().foo()).toBe('here');
    });

    test.each([
      ['mixed', mixed],
      ['object', object],
      ['array', array],
      ['string', string],
      ['number', number],
      ['boolean', boolean],
      ['date', date],
    ])('should work with factories: %s', (_msg, factory) => {
      addMethod(factory, 'foo', () => 'here');

      expect(factory().foo()).toBe('here');
    });

    test.each([
      ['mixed', MixedSchema],
      ['object', ObjectSchema],
      ['array', ArraySchema],
      ['string', StringSchema],
      ['number', NumberSchema],
      ['boolean', BooleanSchema],
      ['date', DateSchema],
    ])('should work with classes: %s', (_msg, ctor) => {
      addMethod(ctor, 'foo', () => 'here');

      expect(new ctor().foo()).toBe('here');
    });
  });
});
