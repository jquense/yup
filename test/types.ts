import { Asserts } from '../src/mixed';
import { string, object, mixed, number } from '../src';

let schema = object({
  str: string().nullable(),
}).shape({
  num: number(),
});

const fff = mixed().nullable();

// type TSchema = typeof schema;
// type tt = TSchema['_tsValidate'];

// const shape = {
//   str: string().nullable(),
// };

// async function foo() {
//   const validate = await schema.validate({});

// }

// type _objNestedNullableRequired = AssertsShape<TSchema['_shape']>;

let f = schema.cast(undefined);

// $ExpectType { str: any, num: any } | undefined
f;

// $ExpectType string | null | undefined
f!.str;

const strNullableRequired = string().nullable().required();
// $ExpectType string
type _strNullableRequired = Asserts<typeof strNullableRequired>;

const strNullable = string().nullable();

// $ExpectType string | null | undefined
type _strNullable = Asserts<typeof strNullable>;

const strPlain = string();

type fff = typeof strPlain['spec']['hasDefault'];

// $ExpectType string | undefined
type _strPlain = Asserts<typeof strPlain>;

const strRequired = string().required();
// $ExpectType string
type _strRequired = Asserts<typeof strRequired>;

const strDefault = string().nullable().default(undefined);
const strDefault2 = string().nullable().default('');

// $ExpectType undefined
strDefault.default();

// $ExpectType string
strDefault2.default();

// $ExpectType string | null
strDefault2.cast(undefined);

// async function foo() {
//   ff = await str.validate(undefined, {});
//   ff = await str2.validate(null, {});
// }

let objWithDefault = object({
  str: string().nullable().default(''),
  num: number().default(3),
  num2: number(),
});
