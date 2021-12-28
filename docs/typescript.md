## TypeScript Support

`yup` comes with robust typescript support, producing values and types from schema that
provide compile time type safety as well as runtime parsing and validation. Schema refine
their output as

```ts
import * as yup from 'yup';

const personSchema = yup.object({
  firstName: yup
    .string()
    // Here we use `defined` instead of `required` to more closely align with
    // TypeScript. Both will have the same effect on the resulting type by
    // excluding `undefined`, but `required` will also disallow empty strings.
    .defined(),
  // defaults also affect the possible output type!
  // schema with default values won't produce `undefined` values. Remember object schema
  // have a default value built in.
  nickName: yup.string().default('').nullable(),
  gender: yup
    .mixed()
    // Note `as const`: this types the array as `["male", "female", "other"]`
    // instead of `string[]`.
    .oneOf(['male', 'female', 'other'] as const)
    .defined(),
  email: yup.string().nullable().notRequired().email(),
  birthDate: yup.date().nullable().notRequired().min(new Date(1900, 0, 1)),
});
```

You can derive a type for the final validated object as follows:

```ts
import type { InferType } from 'yup';

type Person = InferType<typeof personSchema>;

const validated: Person = await personSchema.validate(value);
```

If you want the type produced by casting:

```ts
import type { TypeOf } from 'yup';

interface PersonInput extends TypeOf<typeof personSchema> {}

const validated: PersonInput = personSchema.cast(json);
```

You can also go the other direction, specifying an interface and ensuring that a schema would match it:

```ts
import { string, object, number, SchemaOf } from 'yup';

type Person = {
  firstName: string;
};

// ✔️ compiles
const goodPersonSchema: SchemaOf<Person> = object({
  firstName: string().defined(),
}).defined();

// ❌ errors:
// "Type 'number | undefined' is not assignable to type 'string'."
const badPersonSchema: SchemaOf<Person> = object({
  firstName: number(),
});
```

### TypeScript settings

For type utilties to work correctly you MUST have the `strictNullChecks` compiler option enabled.
We also recommend settings `strictFunctionTypes` to `false`, because some schema
typing doesn't currently work with it on (PRs welcome!).

Yes this reduces overall soundness, however TypeScript already disables this check
anyway for methods and constructors (note from TS docs):

> During development of this feature, we discovered a large number of inherently
> unsafe class hierarchies, including some in the DOM. Because of this,
> the setting only applies to functions written in function syntax, not to those in method syntax:

Your mileage will vary, but we've found that this check doesn't prevent many of
real bugs, while increasing the amount of onerous explicit type casting in apps.

### Extending built-in types

You can use TypeScript's interface merging behavior to extend the schema types
if needed. Type extensions should go in an "ambient" type def file such as your
`globals.d.ts`.

```ts
declare module 'yup' {
  interface StringSchema<TIn, TContext, TOut> {
    myMethod(param: string): this;
  }
}
```

> Watch out!: If your method needs to adjust schema generics, you likely
> need to also extend the Required*, and Defined* interfaces associated with
> each basic type. Consult the core types for examples on how to do this

Be careful of the yup type hierarchy as it's a bit tricky. All schema (including `mixed`)
extend the abstract `BaseSchema` class.

### Special note about MixedSchema and BaseSchema

As far as typescript is concerned, `mixed` schema inherit from `BaseSchema` like other schema; all other schema do **not** extend `MixedSchema`. **In actuality** Mixed is an alias for BaseSchema, meaning `addMethod(mixed)` will add a new method to all schema.

This means that type extensions to `mixed` should generally be put on `BaseSchema` if
you want the method to be available to all sub classes.
