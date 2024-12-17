## [1.6.1](https://github.com/jquense/yup/compare/v1.6.0...v1.6.1) (2024-12-17)


### Bug Fixes

* lazy validation errors thrown in builders should resolve async like other validations ([c7d7f97](https://github.com/jquense/yup/commit/c7d7f977e02a7e578950dff192057e0b200999bd))





# [1.6.0](https://github.com/jquense/yup/compare/v1.5.0...v1.6.0) (2024-12-16)


### Features

* expose LazySchema ([2b0f126](https://github.com/jquense/yup/commit/2b0f1264083fccb646f7f6bd43adfbff2caaf295))





# [1.5.0](https://github.com/jquense/yup/compare/v1.4.0...v1.5.0) (2024-12-03)


### Bug Fixes

* **readme:** some typos and update CustomizingErrors doc ([#2163](https://github.com/jquense/yup/issues/2163)) ([5c77e0d](https://github.com/jquense/yup/commit/5c77e0d4f9373151bcf0cd558c95986b6e4800d7))


### Features

* Add exact and stripUnknown method to object() ([adcdd8d](https://github.com/jquense/yup/commit/adcdd8dd500c627b1efbe3595b6b37dec2847ad8))





# [1.4.0](https://github.com/jquense/yup/compare/v1.3.3...v1.4.0) (2024-03-06)


### Bug Fixes

* add optional message to nonNullable schema methods ([#2119](https://github.com/jquense/yup/issues/2119)) ([9e1df49](https://github.com/jquense/yup/commit/9e1df4938c1964a21e6ece0c458bb96dc5aff108))


### Features

* **string:** Create .datetime() ([#2087](https://github.com/jquense/yup/issues/2087)) ([2a9e060](https://github.com/jquense/yup/commit/2a9e060594423018f517419ef5d2f10e417c9fbd))





## [1.3.3](https://github.com/jquense/yup/compare/v1.3.2...v1.3.3) (2023-12-14)


### Bug Fixes

* **addMethod:** allow Schema without making TypeScript upset ([f921fe6](https://github.com/jquense/yup/commit/f921fe69a2d6ecc6e7d0101d2bd81148dfe83e64))





## [1.3.2](https://github.com/jquense/yup/compare/v1.3.1...v1.3.2) (2023-09-29)


### Bug Fixes

* pick and omit with excluded edges ([6956ee7](https://github.com/jquense/yup/commit/6956ee788369dff00e5ecadb506726af3598a87e)), closes [#2097](https://github.com/jquense/yup/issues/2097)





## [1.3.1](https://github.com/jquense/yup/compare/v1.3.0...v1.3.1) (2023-09-26)


### Bug Fixes

* ValidationError extends Error ([bc5121b](https://github.com/jquense/yup/commit/bc5121b92d8e16baf8fe9b83f0247a4e90e169b8))





# [1.3.0](https://github.com/jquense/yup/compare/v1.2.0...v1.3.0) (2023-09-23)


### Bug Fixes

* add tuple to locale object ([#2100](https://github.com/jquense/yup/issues/2100)) ([809b55a](https://github.com/jquense/yup/commit/809b55a9c16e0cd567f4eced9b9ab02ad8b0bffa))
* performance improvement ([#2043](https://github.com/jquense/yup/issues/2043)) ([#2044](https://github.com/jquense/yup/issues/2044)) ([ee1b731](https://github.com/jquense/yup/commit/ee1b7317b0a9fc0e16a7d33064c3e5584bd7f2d5))


### Features

* Allow schema metadata to be strongly typed ([#2021](https://github.com/jquense/yup/issues/2021)) ([e593f8f](https://github.com/jquense/yup/commit/e593f8f72e7195cf0ac48fa8e1cd82d95c1e6bb5))


### Reverts

* Revert "fix: performance improvement (#2043) (#2044)" (#2071) ([b940eef](https://github.com/jquense/yup/commit/b940eef48eb7456622ae384d0ffa7363d4fbad25)), closes [#2043](https://github.com/jquense/yup/issues/2043) [#2044](https://github.com/jquense/yup/issues/2044) [#2071](https://github.com/jquense/yup/issues/2071)





# [1.2.0](https://github.com/jquense/yup/compare/v1.1.1...v1.2.0) (2023-05-25)


### Features

* expose printValue ([#2002](https://github.com/jquense/yup/issues/2002)) ([#2008](https://github.com/jquense/yup/issues/2008)) ([1fadba1](https://github.com/jquense/yup/commit/1fadba10b0d1cad60f3708bd28282ab04a55eff6))
* pass options to `default(options => value)` ([e5c5440](https://github.com/jquense/yup/commit/e5c5440767d32a8be6c4a12a5f6176924e058fd2)), closes [#1984](https://github.com/jquense/yup/issues/1984)





## [1.1.1](https://github.com/jquense/yup/compare/v1.1.0...v1.1.1) (2023-04-14)


### Bug Fixes

* **docs:** Broken anchores ([#1979](https://github.com/jquense/yup/issues/1979)) ([4ed4576](https://github.com/jquense/yup/commit/4ed45762e955ac6af0dec935a91e815a5a1cf5b9))
* make null validation errors consistent across schema ([#1982](https://github.com/jquense/yup/issues/1982)) ([f999497](https://github.com/jquense/yup/commit/f99949747456d7bf55da3dd38dcf86bbddba3169))
* **object:** excluded edges are merged when concating schema ([c07b08f](https://github.com/jquense/yup/commit/c07b08f033be8eea00d74a5da1cf735cf97e69df)), closes [#1969](https://github.com/jquense/yup/issues/1969)





# [1.1.0](https://github.com/jquense/yup/compare/v1.0.2...v1.1.0) (2023-04-12)


### Bug Fixes

* tuple describe() method ([#1947](https://github.com/jquense/yup/issues/1947)) ([297f168](https://github.com/jquense/yup/commit/297f1682296ee0b53e5e252477d5a6d7d82df707))


### Features

* only resolve "strip()" for schema when used as an object field ([#1977](https://github.com/jquense/yup/issues/1977)) ([2ba1104](https://github.com/jquense/yup/commit/2ba1104798dcf3b9385997e5fbaa41b4d711472d))
* respect context for object's children ([#1971](https://github.com/jquense/yup/issues/1971)) ([edfe6ac](https://github.com/jquense/yup/commit/edfe6acde9e11ec2bfe2ad41aad867daae7041ce))





## [1.0.2](https://github.com/jquense/yup/compare/v1.0.0...v1.0.2) (2023-02-27)


### Bug Fixes

* fix array describe not including conditions ([4040592](https://github.com/jquense/yup/commit/4040592ccd068ab71e06417b4d355007636cb78c)), closes [#1920](https://github.com/jquense/yup/issues/1920)





## [1.0.1](https://github.com/jquense/yup/compare/v1.0.0...v1.0.1) (2023-02-25)





# [1.0.0](https://github.com/jquense/yup/compare/v1.0.0-beta.8...v1.0.0) (2023-02-08)

### Migrating from 0.x to 1.0.0: [#1906](https://github.com/jquense/yup/issues/1906)




# [1.0.0-beta.8](https://github.com/jquense/yup/compare/v1.0.0-beta.7...v1.0.0-beta.8) (2022-11-10)


### Bug Fixes

* check if field exists when generating defaults ([37f686c](https://github.com/jquense/yup/commit/37f686c217a9ee5d6f21f07a812a20467ee83578))
* correct minor typo in README ([#1760](https://github.com/jquense/yup/issues/1760)) ([62786c4](https://github.com/jquense/yup/commit/62786c42ca07a2b84b05ca8c473bc01f0c868a94))
* don't return any for oneOf ([74c5bc5](https://github.com/jquense/yup/commit/74c5bc54220cae5ff491ed92845ecd9c1ed7fbf3)), closes [#1675](https://github.com/jquense/yup/issues/1675)
* export more types ([f250109](https://github.com/jquense/yup/commit/f250109dbf7158f1ee31ccd11f8309d660880252))
* string().notRequired() ([#1824](https://github.com/jquense/yup/issues/1824)) ([dcb4b63](https://github.com/jquense/yup/commit/dcb4b6381eac21f8f28297066e71920a788c8a47))
* TS 4.8 compat ([bc74c34](https://github.com/jquense/yup/commit/bc74c340721da2ea6e65cb27b967c2970af44d35))
* **types:** undefined defaults produce optional outputs ([1afbac0](https://github.com/jquense/yup/commit/1afbac06edfd3277a8c76bb4c8874cf16d4d346d))


### Features

* add some more type exports ([d5e9c99](https://github.com/jquense/yup/commit/d5e9c99e6ef068bff4c4f92db5ccc0835f6b84b3))
* Export ValidateOptions, ISchema for external use ([#1812](https://github.com/jquense/yup/issues/1812)) ([584df11](https://github.com/jquense/yup/commit/584df11b60e5d47876946872973764d0e0e0c9ed))
* respect nullable() with oneOf ([#1757](https://github.com/jquense/yup/issues/1757)) ([61ec302](https://github.com/jquense/yup/commit/61ec3027caba72cb795ee64f571ca0a7aa6bc9a6)), closes [#768](https://github.com/jquense/yup/issues/768) [#104](https://github.com/jquense/yup/issues/104)
* simplify email validation ([440db3e](https://github.com/jquense/yup/commit/440db3e6177d25c06be76995a1deff6e25a90c10))


### BREAKING CHANGES

* previously `oneOf` required adding `null` explicitly to allowed values when using oneOf. Folks have found this confusing and unintuitive so I am deferring and adjusting the behavior
* Use a simpler regex for email addresses that aligns with browsers, and add docs about how to override.





# [1.0.0-beta.7](https://github.com/jquense/yup/compare/v1.0.0-beta.6...v1.0.0-beta.7) (2022-08-20)





# [1.0.0-beta.6](https://github.com/jquense/yup/compare/v1.0.0-beta.5...v1.0.0-beta.6) (2022-08-20)


### Bug Fixes

* change mixed generic to unknown from any ([5e8e8ef](https://github.com/jquense/yup/commit/5e8e8ef132574b31056bc7c504b8ba62c9ae4d1e))
* count stripping unknown fields as changes for object casts ([2b4773c](https://github.com/jquense/yup/commit/2b4773ca8d4dc7b1f30e3927a113eb807d254f37)), closes [#1620](https://github.com/jquense/yup/issues/1620)
* **types:** export more types ([433a452](https://github.com/jquense/yup/commit/433a45252cac4621c00adbeb3c9320caca55cced))





# [1.0.0-beta.5](https://github.com/jquense/yup/compare/v1.0.0-beta.4...v1.0.0-beta.5) (2022-08-19)


### Bug Fixes

* coarce -> coerce ([#1677](https://github.com/jquense/yup/issues/1677)) ([99aa257](https://github.com/jquense/yup/commit/99aa25787a8ff15fe42e54db88ec3ed547357302))
* **docs:** correct typo "coarce" to "coerce" ([#1654](https://github.com/jquense/yup/issues/1654)) ([f29ff71](https://github.com/jquense/yup/commit/f29ff71e4ae04927d85a00a993a014de652ae9fe))


### Features

* add cast nullability migration path. ([#1749](https://github.com/jquense/yup/issues/1749)) ([2bb099e](https://github.com/jquense/yup/commit/2bb099e26f62dd4734fe7bd525d011ce2b1583b5))
* better Lazy types and deepPartial fixes ([#1748](https://github.com/jquense/yup/issues/1748)) ([e4ae6ed](https://github.com/jquense/yup/commit/e4ae6edeb171f25c43ca9367038ad5f09ce9de7c))


### BREAKING CHANGES

* The types for Lazy have changes a bit, it's unlikely that this affects anyone but it is technically a breaking change.





# [1.0.0-beta.4](https://github.com/jquense/yup/compare/v1.0.0-beta.3...v1.0.0-beta.4) (2022-04-10)


### Bug Fixes

* **boolean:** calling optional made it non-optional ([4ba02a1](https://github.com/jquense/yup/commit/4ba02a15b649dccaa090a2e72476c1ea448a3fc1)), closes [#1627](https://github.com/jquense/yup/issues/1627)





# [1.0.0-beta.3](https://github.com/jquense/yup/compare/v1.0.0-beta.2...v1.0.0-beta.3) (2022-03-09)


### Bug Fixes

* correct minor typo in README ([#1582](https://github.com/jquense/yup/issues/1582)) ([facea53](https://github.com/jquense/yup/commit/facea53e3508d041d86076ef065fb80b8ec74286))
* partial() ([1207261](https://github.com/jquense/yup/commit/120726175aa97a9066fb765155ae4fef15b1e0ad))


### BREAKING CHANGES

* 'required' no longer adds a test for most schema, to determine if a schema is required, check it's `spec.optional` and `spec.nullable` values, also accessible via `describe()`





# [1.0.0-beta.2](https://github.com/jquense/yup/compare/v0.32.11...v1.0.0-beta.2) (2022-01-21)


### Bug Fixes

* add originalValue to TestContext type ([#1527](https://github.com/jquense/yup/issues/1527)) ([fcc5ae7](https://github.com/jquense/yup/commit/fcc5ae710a1b3ef4b799532291faf894bdbcc11b)), closes [/github.com/abnersajr/DefinitelyTyped/blob/a186d99d0c3a92424691a82130374a1b9145c7cd/types/yup/index.d.ts#L446](https://github.com//github.com/abnersajr/DefinitelyTyped/blob/a186d99d0c3a92424691a82130374a1b9145c7cd/types/yup/index.d.ts/issues/L446)


* Merge next into master (#1547) ([366f7d8](https://github.com/jquense/yup/commit/366f7d8e280b021bbd7a4a4d3cfc8fa0cce00c8b)), closes [#1547](https://github.com/jquense/yup/issues/1547) [#1542](https://github.com/jquense/yup/issues/1542) [#1541](https://github.com/jquense/yup/issues/1541) [#1543](https://github.com/jquense/yup/issues/1543) [#1545](https://github.com/jquense/yup/issues/1545)


### Features

*  add Tuple type ([#1546](https://github.com/jquense/yup/issues/1546)) ([a8febdd](https://github.com/jquense/yup/commit/a8febddcfbe42358e63194ae8da582e66b746edf))


### BREAKING CHANGES

* The builder object version of `when()` requires `then` and `otherwise` to be
  functions `(schema: Schema) => Schema`.

* The function version of `when()` has been changed to make it easier to type. values are always passed as an array and schema, and options always the second and third argument. `this` is no longer set to the schema instance.  and all functions _must_ return a schema to be type safe

```diff
 string()
-   .when('other', function (other) => {
-      if (other) return this.required()
+   .when('other', ([other], schema) => {
+     return other ? schema.required() : schema
  })
```
* concat works shallowly now. Previously concat functioned like a deep merge for object, which produced confusing behavior with incompatible concat'ed schema. Now concat for objects works similar to how it works for other types, the provided schema is applied on top of the existing schema, producing a new schema that is the same as calling each builder method in order

* docs: update readme

* chore: update to readonly arrays and test string type narrowing

* test: add boolean tests

* docs: more docs

* feat: allow mixed schema to specify type check
* `mixed` schema are no longer treated as the base class for other schema types. It hasn't been for a while, but we've done some nasty prototype slinging to make it behave like it was. Now typescript types should be 1 to 1 with the actual classes yup exposes. 

In general this should not affect anything unless you are extending (via `addMethod` or otherwise) `mixed` prototype. 

```diff
import {
-  mixed,
+  Schema,
} from 'yup';

- addMethod(mixed, 'method', impl)
+ addMethod(Schema, 'method', impl)
```

* chore: prep work for toggling coercion

* Publish v1.0.0-alpha.4

* chore: docs

* feat!: add json() method and remove default object/array coercion
* object and array schema no longer parse JSON strings by default, nor do they return `null` for invalid casts.

```ts
object().json().cast('{}')
array().json().cast('[]')
```
to mimic the previous behavior

* feat: Make Array generic consistent with others
* types only, `ArraySchema`  initial generic is the array type not the type of the array element. `array<T>()` is still the inner type.

* Publish v1.0.0-beta.0

* docs


# [1.0.0-beta.1](https://github.com/jquense/yup/compare/v1.0.0-beta.0...v1.0.0-beta.1) (2022-01-03)


### Features

* flat bundles and size reductions ([753abdf](https://github.com/jquense/yup/commit/753abdf329e33e43c334e405baa9c71999079480))



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
- The builder object version of `when()` requires `then` and `otherwise` to be
  functions `(schema: Schema) => Schema`.
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


## [0.32.11](https://github.com/jquense/yup/compare/v0.32.10...v0.32.11) (2021-10-12)


### Bug Fixes

* dep ranges ([2015c0f](https://github.com/jquense/yup/commit/2015c0f717065360076d5c460a139a2fff410166))





## [0.32.10](https://github.com/jquense/yup/compare/v0.32.9...v0.32.10) (2021-10-11)


### Bug Fixes

* carry over excluded edges when concating objects ([5334349](https://github.com/jquense/yup/commit/53343491f0624120812182a70919a2fc3ebe11f5)), closes [#1423](https://github.com/jquense/yup/issues/1423)
* fix the typo for the array length validation ([#1287](https://github.com/jquense/yup/issues/1287)) ([4c17508](https://github.com/jquense/yup/commit/4c175086ce8e53df529bbdff6f215929a5a39167))
* missing transforms on concat ([f3056f2](https://github.com/jquense/yup/commit/f3056f2cbade92eaf0427848f43df97eae010555)), closes [#1260](https://github.com/jquense/yup/issues/1260)
* oneOf, notOneOf swallowing multiple errors ([#1434](https://github.com/jquense/yup/issues/1434)) ([7842afb](https://github.com/jquense/yup/commit/7842afbaca0a44fc2fea72b44a90c2000ca2b8f0))
* prevent unhandled Promise rejection when returning rejected Promise inside test function ([#1327](https://github.com/jquense/yup/issues/1327)) ([5eda549](https://github.com/jquense/yup/commit/5eda549dfce95be225b0eb6dbe3cbe7bcd5d3347))
* SchemaOf<>'s treatment of Date objects. ([#1305](https://github.com/jquense/yup/issues/1305)) ([91ace1e](https://github.com/jquense/yup/commit/91ace1e8be3fc23c775ec8117c47b406bf29da4a)), closes [#1243](https://github.com/jquense/yup/issues/1243) [#1302](https://github.com/jquense/yup/issues/1302)
* update lodash/lodash-es to fix CVEs flagged in 4.17.20 ([#1334](https://github.com/jquense/yup/issues/1334)) ([70d0b67](https://github.com/jquense/yup/commit/70d0b67e172f695168c5d00bc9856f2f775e0957))
* **utils:** use named functions for default exports ([#1329](https://github.com/jquense/yup/issues/1329)) ([acbb8b4](https://github.com/jquense/yup/commit/acbb8b4f3c24ceaf65eab09abaf8e086a9f11a73))


### Features

* add resolved to params ([#1437](https://github.com/jquense/yup/issues/1437)) ([03584f6](https://github.com/jquense/yup/commit/03584f6758ff43409113c41f58fd41e065aa18a3))
* add types to setLocale ([#1427](https://github.com/jquense/yup/issues/1427)) ([7576cd8](https://github.com/jquense/yup/commit/7576cd836ce9b660c054f9117795dbd9be12f747)), closes [#1321](https://github.com/jquense/yup/issues/1321)
* allows custom types to be passed to avoid cast to ObjectSchema ([#1358](https://github.com/jquense/yup/issues/1358)) ([94cfd11](https://github.com/jquense/yup/commit/94cfd11b3f23e10f731efac05c5525829d10ded1))





## [0.32.9](https://github.com/jquense/yup/compare/v0.32.6...v0.32.9) (2021-02-17)


### Bug Fixes

* **types:** Array required() and defined() will no longer return any ([#1256](https://github.com/jquense/yup/issues/1256)) ([52e5876](https://github.com/jquense/yup/commit/52e5876))
* export MixedSchema to fix ts with --declarations ([#1204](https://github.com/jquense/yup/issues/1204)) ([67c96ae](https://github.com/jquense/yup/commit/67c96ae))
* **types:** add generic to Reference.create() ([#1208](https://github.com/jquense/yup/issues/1208)) ([be3d1b4](https://github.com/jquense/yup/commit/be3d1b4))
* **types:** reach and getIn make last 2 arguments optional ([#1194](https://github.com/jquense/yup/issues/1194)) ([5cf2c48](https://github.com/jquense/yup/commit/5cf2c48))
* do not initialize spec values with undefined ([#1177](https://github.com/jquense/yup/issues/1177)) ([e8e5b46](https://github.com/jquense/yup/commit/e8e5b46)), closes [jquense/yup#1160](https://github.com/jquense/yup/issues/1160) [jquense/yup#1160](https://github.com/jquense/yup/issues/1160)
* **types:** meta() return type ([e41040a](https://github.com/jquense/yup/commit/e41040a))
* array handling in SchemaOf type ([#1169](https://github.com/jquense/yup/issues/1169)) ([e785e1a](https://github.com/jquense/yup/commit/e785e1a))
* **types:** make StringSchema.matches options optional ([#1166](https://github.com/jquense/yup/issues/1166)) ([b53e5f2](https://github.com/jquense/yup/commit/b53e5f2))
* **types:** SchemaOf doesn't produce a union of base schema ([2d71f32](https://github.com/jquense/yup/commit/2d71f32))





## [0.32.6](https://github.com/jquense/yup/compare/v0.32.5...v0.32.6) (2020-12-08)


### Bug Fixes

* mixed() is the the base class ([7f8591d](https://github.com/jquense/yup/commit/7f8591d)), closes [#1156](https://github.com/jquense/yup/issues/1156)





## [0.32.5](https://github.com/jquense/yup/compare/v0.32.4...v0.32.5) (2020-12-07)


### Bug Fixes

* **types:** change base.default() to any ([01c6930](https://github.com/jquense/yup/commit/01c6930))





## [0.32.4](https://github.com/jquense/yup/compare/v0.32.3...v0.32.4) (2020-12-07)


### Bug Fixes

* **types:** rm base pick/omit types as they conflict with more specific ones ([14e2c8c](https://github.com/jquense/yup/commit/14e2c8c))


### Features

* add additional functions to Lazy class ([#1148](https://github.com/jquense/yup/issues/1148)) ([ecad1a3](https://github.com/jquense/yup/commit/ecad1a3))





## [0.32.3](https://github.com/jquense/yup/compare/v0.32.2...v0.32.3) (2020-12-07)


### Bug Fixes

* **types:** AnyObjectSchema anys ([1c54665](https://github.com/jquense/yup/commit/1c54665))





## [0.32.2](https://github.com/jquense/yup/compare/v0.32.1...v0.32.2) (2020-12-07)


### Bug Fixes

* **types:** array type with lazy ([ba92dfc](https://github.com/jquense/yup/commit/ba92dfc)), closes [#1146](https://github.com/jquense/yup/issues/1146)





## [0.32.1](https://github.com/jquense/yup/compare/v0.32.0...v0.32.1) (2020-12-04)


### Bug Fixes

* cyclical import ([d5c5391](https://github.com/jquense/yup/commit/d5c5391)), closes [#1138](https://github.com/jquense/yup/issues/1138)
* some strict fn type improvements ([8092218](https://github.com/jquense/yup/commit/8092218))





# [0.32.0](https://github.com/jquense/yup/compare/v0.31.1...v0.32.0) (2020-12-03)


### Features

* typescript support ([#1134](https://github.com/jquense/yup/issues/1134)) ([b97c39d](https://github.com/jquense/yup/commit/b97c39d))


### BREAKING CHANGES

* `concat` doesn't check for "unset" nullable or presence when merging meaning the nullability and presence will always be the same as the schema passed to `concat()`. They can be overridden if needed after concatenation
* schema factory functions are no longer constructors. The classes are now also exported for extension or whatever else. e.g. `import { StringSchema, string } from 'yup'`





## [0.31.1](https://github.com/jquense/yup/compare/v0.31.0...v0.31.1) (2020-12-01)


### Bug Fixes

* swallowed errors on nested schema with no tests ([5316ab9](https://github.com/jquense/yup/commit/5316ab9)), closes [#1127](https://github.com/jquense/yup/issues/1127)


### Features

* add `isTrue` and `isFalse` checks on boolean ([#910](https://github.com/jquense/yup/issues/910)) ([630a641](https://github.com/jquense/yup/commit/630a641))





# [0.31.0](https://github.com/jquense/yup/compare/v0.30.0...v0.31.0) (2020-11-23)


### Bug Fixes

* path params incorrectly mutated ([ba23eb7](https://github.com/jquense/yup/commit/ba23eb7)), closes [#1122](https://github.com/jquense/yup/issues/1122)


### Features

* add array.length() and treat empty arrays as valid for required() ([fbc158d](https://github.com/jquense/yup/commit/fbc158d))
* add object.pick and object.omit ([425705a](https://github.com/jquense/yup/commit/425705a))
* deprecate the getter overload of `default()` ([#1119](https://github.com/jquense/yup/issues/1119)) ([5dae837](https://github.com/jquense/yup/commit/5dae837))
* more strictly coerce strings, exclude arrays and plain objects ([963d2e8](https://github.com/jquense/yup/commit/963d2e8))


### BREAKING CHANGES

* array().required() will no longer consider an empty array missing and required checks will pass.

To maintain the old behavior change to:
```js
array().required().min(1)
```
* plain objects and arrays are no long cast to strings automatically

to recreate the old behavior:
```js
string().transform((_, input) => input != null && input.toString ? input.toString() : value);
```





# [0.30.0](https://github.com/jquense/yup/compare/v0.29.3...v0.30.0) (2020-11-19)


### Bug Fixes

* defined() so it doesn't mark a schema as nullable ([f08d507](https://github.com/jquense/yup/commit/f08d507))
* IE11 clone() ([#1029](https://github.com/jquense/yup/issues/1029)) ([7fd80aa](https://github.com/jquense/yup/commit/7fd80aa))
* security Fix for Prototype Pollution - huntr.dev ([#1088](https://github.com/jquense/yup/issues/1088)) ([15a0f43](https://github.com/jquense/yup/commit/15a0f43))
* uuid's regexp ([#1112](https://github.com/jquense/yup/issues/1112)) ([57d42a8](https://github.com/jquense/yup/commit/57d42a8))


### Features

* exposes context on mixed.test function and add originalValue to context ([#1021](https://github.com/jquense/yup/issues/1021)) ([6096064](https://github.com/jquense/yup/commit/6096064))


### Performance Improvements

* reduce function calls for shallower stacks ([#1022](https://github.com/jquense/yup/issues/1022)) ([01da7e1](https://github.com/jquense/yup/commit/01da7e1))


### BREAKING CHANGES

* defined() now doesn't automatically allow null, this was a bug. to mimic the old behavior add nullable() to schema with defined()





## [0.29.3](https://github.com/jquense/yup/compare/v0.29.2...v0.29.3) (2020-08-04)





## [0.29.2](https://github.com/jquense/yup/compare/v0.29.1...v0.29.2) (2020-07-27)


### Bug Fixes

* handle sparse array positions as undefined ([#950](https://github.com/jquense/yup/issues/950)) ([4e77348](https://github.com/jquense/yup/commit/4e77348))


### Features

* string UUID validation via a regex ([#909](https://github.com/jquense/yup/issues/909)) ([8f2bd2b](https://github.com/jquense/yup/commit/8f2bd2b))





## [0.29.1](https://github.com/jquense/yup/compare/v0.29.0...v0.29.1) (2020-05-27)


### Bug Fixes

* present checks for array and strings ([ecd8ebe](https://github.com/jquense/yup/commit/ecd8ebe483456805d743c888a82e180394ba8a22)), closes [#913](https://github.com/jquense/yup/issues/913)


### Features

* allow access to parent schema (and unlimited ancestors!) in test context ([#556](https://github.com/jquense/yup/issues/556)) ([db35920](https://github.com/jquense/yup/commit/db35920b1ede4ea41ea90e1204b3da2a39787635))





# [0.29.0](https://github.com/jquense/yup/compare/v0.28.5...v0.29.0) (2020-05-19)


* feat!: update docs to account for changes in types and add additional example (#891) ([e105a71](https://github.com/jquense/yup/commit/e105a71)), closes [#891](https://github.com/jquense/yup/issues/891)


### Bug Fixes

* object bug when nested object has a property with strict ([#871](https://github.com/jquense/yup/issues/871)) ([7f52b8a](https://github.com/jquense/yup/commit/7f52b8a))


### Features

* expose oneOf and notOneOf values on description ([#885](https://github.com/jquense/yup/issues/885)) ([08dad5f](https://github.com/jquense/yup/commit/08dad5f))


### BREAKING CHANGES

* For users of `@types/yup` only, no function changes but the type def change is large enough that it warranted a major bump here





## [0.28.5](https://github.com/jquense/yup/compare/v0.28.4...v0.28.5) (2020-04-30)

### Bug Fixes

- allow passing of function to .matches() options/message param ([#850](https://github.com/jquense/yup/issues/850)) ([16efe88](https://github.com/jquense/yup/commit/16efe88a8953db60438f77f43bd5bf614079803d))
- bug in object.noUnknown for nullish values https://github.com/jquense/yup/issues/854 ([#855](https://github.com/jquense/yup/issues/855)) ([ccb7c7d](https://github.com/jquense/yup/commit/ccb7c7d3c450537dffbb7d589e3111fc1f9a86fd))

## [0.28.4](https://github.com/jquense/yup/compare/v0.28.3...v0.28.4) (2020-04-20)

### Bug Fixes

- array reaching ([81e4058](https://github.com/jquense/yup/commit/81e4058))

### Features

- make schema.type and array.innerType public API's ([8f00d50](https://github.com/jquense/yup/commit/8f00d50))
- provide keys in default noUnknown message ([#579](https://github.com/jquense/yup/issues/579)) ([ad5d015](https://github.com/jquense/yup/commit/ad5d015))

## [0.28.3](https://github.com/jquense/yup/compare/v0.28.2...v0.28.3) (2020-03-06)

### Bug Fixes

- array.ensure ([94659c2](https://github.com/jquense/yup/commit/94659c2)), closes [#343](https://github.com/jquense/yup/issues/343)
- match options ([493cc61](https://github.com/jquense/yup/commit/493cc61)), closes [#802](https://github.com/jquense/yup/issues/802) [#801](https://github.com/jquense/yup/issues/801) [#799](https://github.com/jquense/yup/issues/799) [#798](https://github.com/jquense/yup/issues/798)

# [0.28.0](https://github.com/jquense/yup/compare/v0.26.10...v0.28.0) (2019-12-16)

### Bug Fixes

- [#473](https://github.com/jquense/yup/issues/473) make concat compatible with (not)oneOf ([#492](https://github.com/jquense/yup/issues/492)) ([8d21cc9](https://github.com/jquense/yup/commit/8d21cc9))
- array path resolve for descendants ([#669](https://github.com/jquense/yup/issues/669)) ([d31e34d](https://github.com/jquense/yup/commit/d31e34d))
- change @babel/runtime version to be a range ([#488](https://github.com/jquense/yup/issues/488)) ([1c9b362](https://github.com/jquense/yup/commit/1c9b362)), closes [#486](https://github.com/jquense/yup/issues/486)
- concat of mixed and subtype ([#444](https://github.com/jquense/yup/issues/444)) ([7705972](https://github.com/jquense/yup/commit/7705972))
- default message for test with object ([#453](https://github.com/jquense/yup/issues/453)) ([f1be37f](https://github.com/jquense/yup/commit/f1be37f))
- noUnknown() overriding ([#452](https://github.com/jquense/yup/issues/452)) ([3047b33](https://github.com/jquense/yup/commit/3047b33))
- string.matches() and regex global flag ([#450](https://github.com/jquense/yup/issues/450)) ([a8935b7](https://github.com/jquense/yup/commit/a8935b7))
- synchronous conditional object validation with unknown dependencies ([#598](https://github.com/jquense/yup/issues/598)) ([1081c41](https://github.com/jquense/yup/commit/1081c41))
- typo README (about excludeEmptyString) ([#441](https://github.com/jquense/yup/issues/441)) ([d02ff5e](https://github.com/jquense/yup/commit/d02ff5e))
- unix epoc bug in date parser ([#655](https://github.com/jquense/yup/issues/655)) ([0d14827](https://github.com/jquense/yup/commit/0d14827))

### Features

- add \_isFilled as overrideable `mixed` method to control required behavior ([#459](https://github.com/jquense/yup/issues/459)) ([5b01f18](https://github.com/jquense/yup/commit/5b01f18))
- add function test names to email and url ([#292](https://github.com/jquense/yup/issues/292)) ([7e94395](https://github.com/jquense/yup/commit/7e94395))
- aliases `optional()` and `unknown()` ([#460](https://github.com/jquense/yup/issues/460)) ([51e8661](https://github.com/jquense/yup/commit/51e8661))
- allow toggling strict() ([#457](https://github.com/jquense/yup/issues/457)) ([851d421](https://github.com/jquense/yup/commit/851d421))
- allow withMutation() nesting ([#456](https://github.com/jquense/yup/issues/456)) ([e53ea8c](https://github.com/jquense/yup/commit/e53ea8c))
- do concat in mutation mode ([#461](https://github.com/jquense/yup/issues/461)) ([02be4ca](https://github.com/jquense/yup/commit/02be4ca))
- finalize resolve() ([#447](https://github.com/jquense/yup/issues/447)) ([afc5119](https://github.com/jquense/yup/commit/afc5119))
- replace integer check with Number.isInteger ([#405](https://github.com/jquense/yup/issues/405)) ([1c18442](https://github.com/jquense/yup/commit/1c18442))
- support self references ([#443](https://github.com/jquense/yup/issues/443)) ([1cac515](https://github.com/jquense/yup/commit/1cac515)), closes [/github.com/jquense/yup/blob/d02ff5e59e004b4c5189d1b9fc0055cff45c61df/src/Reference.js#L3](https://github.com//github.com/jquense/yup/blob/d02ff5e59e004b4c5189d1b9fc0055cff45c61df/src/Reference.js/issues/L3)
- use the alternate object index path syntax if the key contains dots (fixes [#536](https://github.com/jquense/yup/issues/536)) ([#539](https://github.com/jquense/yup/issues/539)) ([13e8c76](https://github.com/jquense/yup/commit/13e8c76))

### BREAKING CHANGES

- use Number.isInteger. This works correctly for large numbers.

Related to https://github.com/jquense/yup/pull/147

- reach() no longer resolves the returned schema meaning it's conditions have not been processed yet; prefer validateAt/castAt where it makes sense
- required no longer shows up twice in describe() output for array and strings, which also no longer override required

# [0.27.0](https://github.com/jquense/yup/compare/v0.26.10...v0.27.0) (2019-03-14)

### Bug Fixes

- change @babel/runtime version to be a range ([#488](https://github.com/jquense/yup/issues/488)) ([1c9b362](https://github.com/jquense/yup/commit/1c9b362)), closes [#486](https://github.com/jquense/yup/issues/486)
- concat of mixed and subtype ([#444](https://github.com/jquense/yup/issues/444)) ([7705972](https://github.com/jquense/yup/commit/7705972))
- default message for test with object ([#453](https://github.com/jquense/yup/issues/453)) ([f1be37f](https://github.com/jquense/yup/commit/f1be37f))
- noUnknown() overriding ([#452](https://github.com/jquense/yup/issues/452)) ([3047b33](https://github.com/jquense/yup/commit/3047b33))
- typo README (about excludeEmptyString) ([#441](https://github.com/jquense/yup/issues/441)) ([d02ff5e](https://github.com/jquense/yup/commit/d02ff5e))

### Features

- add \_isFilled as overrideable `mixed` method to control required behavior ([#459](https://github.com/jquense/yup/issues/459)) ([5b01f18](https://github.com/jquense/yup/commit/5b01f18))
- aliases `optional()` and `unknown()` ([#460](https://github.com/jquense/yup/issues/460)) ([51e8661](https://github.com/jquense/yup/commit/51e8661))
- allow toggling strict() ([#457](https://github.com/jquense/yup/issues/457)) ([851d421](https://github.com/jquense/yup/commit/851d421))
- allow withMutation() nesting ([#456](https://github.com/jquense/yup/issues/456)) ([e53ea8c](https://github.com/jquense/yup/commit/e53ea8c))
- do concat in mutation mode ([#461](https://github.com/jquense/yup/issues/461)) ([02be4ca](https://github.com/jquense/yup/commit/02be4ca))
- finalize resolve() ([#447](https://github.com/jquense/yup/issues/447)) ([afc5119](https://github.com/jquense/yup/commit/afc5119))
- support self references ([#443](https://github.com/jquense/yup/issues/443)) ([1cac515](https://github.com/jquense/yup/commit/1cac515)), closes [/github.com/jquense/yup/blob/d02ff5e59e004b4c5189d1b9fc0055cff45c61df/src/Reference.js#L3](https://github.com//github.com/jquense/yup/blob/d02ff5e59e004b4c5189d1b9fc0055cff45c61df/src/Reference.js/issues/L3)

### BREAKING CHANGES

- reach() no longer resolves the returned schema meaning it's conditions have not been processed yet; prefer validateAt/castAt where it makes sense
- required no longer shows up twice in describe() output for array and strings, which also no longer override required

## v0.26.3 - Tue, 28 Aug 2018 15:00:04 GMT

## v0.26.0 - Fri, 20 Jul 2018 15:39:03 GMT

### BREAKING CHANGES

- locale `number` config properties `less` and `more` are now `lessThan` and `moreThan`

## v0.25.1 - Wed, 16 May 2018 23:59:14 GMT

## v0.25.0 - Tue, 15 May 2018 21:43:54 GMT

- remove default export, there are only named exports now!
- fix message defaults for built-in tests, default is only used for `undefined` messages
- fix the `describe()` method so it works with nested schemas

## v0.24.1 - Fri, 09 Feb 2018 19:09:02 GMT

## v0.24.0 - Tue, 16 Jan 2018 14:44:32 GMT

- [f2a0b75](../../commit/f2a0b75), [061e590](../../commit/061e590) [added] number methods lessThan, moreThan

## v0.23.0 - Thu, 12 Oct 2017 17:08:47 GMT

** Probably not breaking but we are being safe about it **

- 🎉 Add Synchronous validation! [#94](https://github.com/jquense/yup/pull/94)

** Features **

- Custom locales without import order [#125](https://github.com/jquense/yup/pull/125)

## v0.22.1 - Thu, 12 Oct 2017 14:49:16 GMT

- Fix bug in browsers without symbol [#132](https://github.com/jquense/yup/pull/132)

## v0.22.0 - Sat, 26 Aug 2017 14:48:57 GMT

** Breaking **

- Use native Set and lodash CloneDeep: [#109](https://github.com/jquense/yup/pull/109)

\*\* Fixes and Features

- Better custom locale support: [#105](https://github.com/jquense/yup/pull/105)
- fix some messages: [#112](https://github.com/jquense/yup/pull/112)
- Clearer errors for common mistakes: [#108](https://github.com/jquense/yup/pull/108)
- New string validation length: [#67](https://github.com/jquense/yup/pull/67)

## v0.21.3 - Wed, 18 Jan 2017 15:39:25 GMT

- [7bc01e0](../../commit/7bc01e0) [added] deep path support for `from`

## v0.21.2 - Fri, 09 Sep 2016 16:52:44 GMT

- [be80413](../../commit/be80413) [fixed] default in concat()

## v0.21.1 - Mon, 29 Aug 2016 18:39:29 GMT

## v0.21.0 - Mon, 29 Aug 2016 18:29:31 GMT

- [8a8cc5b](../../commit/8a8cc5b) [changed] remove case aliases and simplify camelCase

## v0.20.0 - Wed, 20 Jul 2016 02:02:08 GMT

- [f7446d2](../../commit/f7446d2) [fixed] pass path correctly to cast()
- [9b5232a](../../commit/9b5232a) [added] allow function then/otherwise bodies
- [73858fe](../../commit/73858fe) [changed] Don't throw on undefined values in cast()

## v0.19.1 - Mon, 18 Jul 2016 21:53:05 GMT

- [69c0ad4](../../commit/69c0ad4) [fixed] array().concat() incorrectly cleared the sub-schema

## v0.19.0 - Fri, 24 Jun 2016 15:19:48 GMT

- [b0dd021](../../commit/b0dd021) [changed] Split integer(), remove transform
- [758ac51](../../commit/758ac51) [added] string.ensure
- [f2b0078](../../commit/f2b0078) [changed] Less aggressive type coercions
- [ab94510](../../commit/ab94510) [fixed] boxed number allowed NaN

## v0.18.3 - Mon, 09 May 2016 15:50:47 GMT

## v0.18.2 - Mon, 25 Apr 2016 18:23:13 GMT

## v0.18.1 - Mon, 25 Apr 2016 15:01:16 GMT

- [816e607](../../commit/816e607) [added] validation params to ValidationError

## v0.18.0 - Sat, 23 Apr 2016 01:20:27 GMT

- [f827822](../../commit/f827822) [changed] validate() on objects won't cast nested schema with strict()

## v0.17.6 - Thu, 21 Apr 2016 14:59:59 GMT

- [139dd24](../../commit/139dd24) [changed] lazy qualifies as a yup schema

## v0.17.5 - Thu, 21 Apr 2016 11:20:16 GMT

- [c553cc0](../../commit/c553cc0) [added] options to lazy resolve

## v0.17.4 - Wed, 20 Apr 2016 14:15:39 GMT

## v0.17.3 - Tue, 19 Apr 2016 20:24:09 GMT

- [6c309e4](../../commit/6c309e4) [fixed] array.ensure()

## v0.17.2 - Tue, 19 Apr 2016 16:46:54 GMT

## v0.17.1 - Thu, 14 Apr 2016 19:12:22 GMT

- [ab78f54](../../commit/ab78f54) [fixed] reach with lazy()

## v0.17.0 - Thu, 14 Apr 2016 17:13:50 GMT

- [6e9046b](../../commit/6e9046b) [changed] clean up interface, added lazy(), and fixed object strict semantics

## v0.16.5 - Tue, 12 Apr 2016 13:36:38 GMT

- [c3b613b](../../commit/c3b613b) [added] strip() method for objects
- [68fc010](../../commit/68fc010) [added] array.of shorthand

## v0.16.4 - Sat, 09 Apr 2016 20:13:13 GMT

- [f30d1e3](../../commit/f30d1e3) [fixed] bug in date min/max with ref

## v0.16.3 - Thu, 07 Apr 2016 19:13:23 GMT

## v0.16.2 - Thu, 07 Apr 2016 17:57:44 GMT

- [83c0656](../../commit/83c0656) [added] meta() and describe()

## v0.16.1 - Tue, 05 Apr 2016 20:56:45 GMT

- [9d70a7b](../../commit/9d70a7b) [changed] doesn't throw when context is missing.
- [594fa53](../../commit/594fa53) [changed] added reach error

## v0.16.0 - Tue, 05 Apr 2016 20:17:40 GMT

- [75739b8](../../commit/75739b8) [added] context sensitive reach()

## v0.15.0 - Tue, 29 Mar 2016 14:56:15 GMT

- [3ae5fdc](../../commit/3ae5fdc) [changed] `null` is not considered an empty value for isValid
- [9eb42c6](../../commit/9eb42c6) [added] refs!

## v0.14.2 - Tue, 29 Mar 2016 14:48:37 GMT

## v0.14.1 - Tue, 16 Feb 2016 19:51:25 GMT

- [ff19720](../../commit/ff19720) [fixed] noUnknown and stripUnknown work and propagate to children

## v0.14.0 - Mon, 08 Feb 2016 16:17:40 GMT

- [86b6446](../../commit/86b6446) [fixed] camelCase should maintain leading underscores

## v0.13.0 - Mon, 01 Feb 2016 20:49:40 GMT

- [335eb18](../../commit/335eb18) [fixed] pass options to array sub schema
- [f7f631d](../../commit/f7f631d) [changed] oneOf doesn't include empty values
- [0a7b2d4](../../commit/0a7b2d4) [fixed] type and whitelist/blacklist checks threw inconsistent errors
- [1274a45](../../commit/1274a45) [changed] required() to non-exclusive

## v0.12.0 - Tue, 12 Jan 2016 19:12:18 GMT

- [5bc250f](../../commit/5bc250f) [changed] don't clone unspecified object keys
- [069c6fd](../../commit/069c6fd) [added] withMutation() method
- [e1d4891](../../commit/e1d4891) [fixed] don't alias non existent fields

## v0.11.0 - Sun, 08 Nov 2015 17:17:09 GMT

- [686f6b1](../../commit/686f6b1) [changed] concat() allows mixing "mixed" and other type

## 0.9.0

**breaking**

- `test` functions are no longer passed `path` and `context` as arguments, Instead they are now values on `this` inside the test function.
- test functions are longer called with the schema as their `this` value, use `this.schema` instead.

**other changes**

- test functions are call with with a new context object, including, options, parent and `createError` for dynamically altering validation errors.

## 0.8.3

- document `stripUnknown`
- add `recursive` option
- add `noUnknown()` test to objects

## 0.8.2

- default for objects now adds keys for all fields, not just fields with non empty defaults

## 0.8.1

- bug fix

## 0.8.0

**breaking**

- `test` functions are now passed `path` and `context` values along with the field value. Only breaks if using the callback style of defining custom validations

## 0.7.0

**breaking**

- the `validation()` method has been renamed to `test()` and has a new signature requiring a `name` argument
- exclusive validations now trump the previous one instead of defering to it e.g: `string().max(10).max(15)` has a max of `15` instead of `10`

**other changes**

- expose advanced signature for custom validation tests, gives finer grained control over how tests are added
- added the `abortEarly` (default: `true`) option
- transforms are passed an addition parameter: 'originalValue' you allow recovering from a bad transform further up the chain (provided no one mutated the value)

## 0.6.3

- fix `concat()` method and add tests

## 0.6.2

- fix validations where nullable fields were failing due to `null` values e.g `string.max()`

## 0.6.1

- fix export error

## 0.6.0

**breaking**

- Removed the `extend` and `create` methods. Use whatever javascript inheritance patterns you want instead.
- the resolution order of defaults and coercions has changed. as well as the general handling of `null` values.
  - Number: `null` will coerce to `false` when `nullable()` is not specified. `NaN` values will now fail `isType()` checks
  - String: `null` will coerce to `''` when `nullable()` is not specified
  - Date: Invalid dates will not be coerced to `null`, but left as invalid date, This is probably not a problem for anyone as invalid dates will also fail `isType()` checks
- default values are cloned everytime they are returned, so it is impossible to share references to defaults across schemas. No one should be doing that anyway
- stopped pretending that using schemas as conditions in `when()` actually worked (it didn't)

**other changes**

- `transform()` now passes the original value to each transformer. Allowing you to recover from a bad transform.
- added the `equals()` alias for `oneOf`
-

## 0.5.0

**breaking**

- isValid is now async, provide a node style callback, or use the promise the method returns to read the validity. This change allows for more robust validations, specifically remote ones for client code (or db queries for server code). The cast method is still, and will remain, synchronous.
-

**other changes**

- added validate method (also async) which resolves to the value, and rejects with a new ValidationError
