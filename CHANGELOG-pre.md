# [1.0.0-beta.0](https://github.com/jquense/yup/compare/v1.0.0-alpha.4...v1.0.0-beta.0) (2021-12-29)


* feat!: add json() method and remove default object/array coercion ([94b73c4](https://github.com/jquense/yup/commit/94b73c438b3d355253f488325e06c69378e71fc1))


### Features

* Make Array generic consistent with others ([a82353f](https://github.com/jquense/yup/commit/a82353f37735daec6e42d18bd4cc0efe52a20f50))


### BREAKING CHANGES

* types only, `ArraySchema`  initial generic is the array type not the type of the array element. `array<T>()` is still the inner type.
* object and array schema no longer parse JSON strings by default, nor do they return `null` for invalid casts.

```ts
object().json().cast('{}')
array().json().cast('[]')
```
to mimic the previous behavior



# [1.0.0-alpha.4](https://github.com/jquense/yup/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2021-12-29)

### Bug Fixes

- add originalValue to TestContext type ([#1527](https://github.com/jquense/yup/issues/1527)) ([fcc5ae7](https://github.com/jquense/yup/commit/fcc5ae710a1b3ef4b799532291faf894bdbcc11b)), closes [/github.com/abnersajr/DefinitelyTyped/blob/a186d99d0c3a92424691a82130374a1b9145c7cd/types/yup/index.d.ts#L446](https://github.com//github.com/abnersajr/DefinitelyTyped/blob/a186d99d0c3a92424691a82130374a1b9145c7cd/types/yup/index.d.ts/issues/L446)

### Features

- allow mixed schema to specify type check ([3923039](https://github.com/jquense/yup/commit/3923039558733d34586df2b282d34c5b6cbc5111))
- concat() is shallow and does not merge ([#1541](https://github.com/jquense/yup/issues/1541)) ([a2f99d9](https://github.com/jquense/yup/commit/a2f99d9e8d8ba1b285fa6f48a0dd77a77f629ee4))
- simplify base class hierarchy ([#1543](https://github.com/jquense/yup/issues/1543)) ([c184dcf](https://github.com/jquense/yup/commit/c184dcf644c09f3c4697cd3e5c795784a5315f77))
- stricter `when` types and API ([#1542](https://github.com/jquense/yup/issues/1542)) ([da74254](https://github.com/jquense/yup/commit/da742545a228b909fef6f7fa526ea7b459d96051))

### BREAKING CHANGES

- `mixed` schema are no longer treated as the base class for other schema types. It hasn't been for a while, but we've done some nasty prototype slinging to make it behave like it was. Now typescript types should be 1 to 1 with the actual classes yup exposes.

In general this should not affect anything unless you are extending (via `addMethod` or otherwise) `mixed` prototype.

```diff
import {
-  mixed,
+  Schema,
} from 'yup';

- addMethod(mixed, 'method', impl)
+ addMethod(Schema, 'method', impl)
```

- concat works shallowly now. Previously concat functioned like a deep merge for object, which produced confusing behavior with incompatible concat'ed schema. Now concat for objects works similar to how it works for other types, the provided schema is applied on top of the existing schema, producing a new schema that is the same as calling each builder method in order
- The function version of `when()` has been changed to make it easier to type. values are always passed as an array and schema, and options always the second and third argument. `this` is no longer set to the schema instance. and all functions _must_ return a schema to be type safe

```diff
 string()
-   .when('other', function (other) => {
-      if (other) return this.required()
+   .when('other', ([other], schema) => {
+     return other ? schema.required() : schema
  })
```

# [1.0.0-alpha.3](https://github.com/jquense/yup/compare/v0.32.11...v1.0.0-alpha.3) (2021-12-28)

### Bug Fixes

- schemaOf handles Dates ([c1fc816](https://github.com/jquense/yup/commit/c1fc816cdb03f7c9ff2e6745ff38a2b4f119d556))
- **types:** use type import/export ([#1238](https://github.com/jquense/yup/issues/1238)) ([bc284b5](https://github.com/jquense/yup/commit/bc284b5dbd4541464eb4a4edee73cb4d50c00fa7))

### Features

- More intuitive Object generics, faster types ([#1540](https://github.com/jquense/yup/issues/1540)) ([912e0be](https://github.com/jquense/yup/commit/912e0bed1e0184ba9c94015dc187eb6f86bb84d5))

# [1.0.0-alpha.2](https://github.com/jquense/yup/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2020-12-18)

# [1.0.0-alpha.1](https://github.com/jquense/yup/compare/v1.0.0-alpha.0...v1.0.0-alpha.1) (2020-12-18)

### Bug Fixes

- **types:** make properties optional ([ba107cb](https://github.com/jquense/yup/commit/ba107cb50302e5245b960ed9a33f1c2167cc5d73))
- **types:** make properties optional ([495ae84](https://github.com/jquense/yup/commit/495ae84f8bfc22b9f4310700d4d8e9586584a4c7))

### Features

- remove unneeded Out type from schema ([0bf9732](https://github.com/jquense/yup/commit/0bf97327d406c9d982b2c0a93069bd047b53d5ef))

# [1.0.0-alpha.0](https://github.com/jquense/yup/compare/v0.32.8...v1.0.0-alpha.0) (2020-12-14)

### Features

- add describe and meta to lazy, with resolve options ([e56fea3](https://github.com/jquense/yup/commit/e56fea3d09707e975fa1e3bc19fadaac4d8b065b))
