## v0.24.1 - Fri, 09 Feb 2018 19:09:02 GMT

## v0.24.0 - Tue, 16 Jan 2018 14:44:32 GMT

* [f2a0b75](../../commit/f2a0b75), [061e590](../../commit/061e590) [added] number methods lessThan, moreThan

## v0.23.0 - Thu, 12 Oct 2017 17:08:47 GMT

** Probably not breaking but we are being safe about it **

* 🎉 Add Synchronous validation! [#94](https://github.com/jquense/yup/pull/94)

** Features **

* Custom locales without import order [#125](https://github.com/jquense/yup/pull/125)

## v0.22.1 - Thu, 12 Oct 2017 14:49:16 GMT

* Fix bug in browsers without symbol [#132](https://github.com/jquense/yup/pull/132)

## v0.22.0 - Sat, 26 Aug 2017 14:48:57 GMT

** Breaking **

* Use native Set and lodash CloneDeep: [#109](https://github.com/jquense/yup/pull/109)

\*\* Fixes and Features

* Better custom locale support: [#105](https://github.com/jquense/yup/pull/105)
* fix some messages: [#112](https://github.com/jquense/yup/pull/112)
* Clearer errors for common mistakes: [#108](https://github.com/jquense/yup/pull/108)
* New string validation length: [#67](https://github.com/jquense/yup/pull/67)

## v0.21.3 - Wed, 18 Jan 2017 15:39:25 GMT

* [7bc01e0](../../commit/7bc01e0) [added] deep path support for `from`

## v0.21.2 - Fri, 09 Sep 2016 16:52:44 GMT

* [be80413](../../commit/be80413) [fixed] default in concat()

## v0.21.1 - Mon, 29 Aug 2016 18:39:29 GMT

## v0.21.0 - Mon, 29 Aug 2016 18:29:31 GMT

* [8a8cc5b](../../commit/8a8cc5b) [changed] remove case aliases and simplify camelCase

## v0.20.0 - Wed, 20 Jul 2016 02:02:08 GMT

* [f7446d2](../../commit/f7446d2) [fixed] pass path correctly to cast()
* [9b5232a](../../commit/9b5232a) [added] allow function then/otherwise bodies
* [73858fe](../../commit/73858fe) [changed] Don't throw on undefined values in cast()

## v0.19.1 - Mon, 18 Jul 2016 21:53:05 GMT

* [69c0ad4](../../commit/69c0ad4) [fixed] array().concat() incorrectly cleared the sub-schema

## v0.19.0 - Fri, 24 Jun 2016 15:19:48 GMT

* [b0dd021](../../commit/b0dd021) [changed] Split integer(), remove transform
* [758ac51](../../commit/758ac51) [added] string.ensure
* [f2b0078](../../commit/f2b0078) [changed] Less aggressive type coercions
* [ab94510](../../commit/ab94510) [fixed] boxed number allowed NaN

## v0.18.3 - Mon, 09 May 2016 15:50:47 GMT

## v0.18.2 - Mon, 25 Apr 2016 18:23:13 GMT

## v0.18.1 - Mon, 25 Apr 2016 15:01:16 GMT

* [816e607](../../commit/816e607) [added] validation params to ValidationError

## v0.18.0 - Sat, 23 Apr 2016 01:20:27 GMT

* [f827822](../../commit/f827822) [changed] validate() on objects won't cast nested schema with strict()

## v0.17.6 - Thu, 21 Apr 2016 14:59:59 GMT

* [139dd24](../../commit/139dd24) [changed] lazy qualifies as a yup schema

## v0.17.5 - Thu, 21 Apr 2016 11:20:16 GMT

* [c553cc0](../../commit/c553cc0) [added] options to lazy resolve

## v0.17.4 - Wed, 20 Apr 2016 14:15:39 GMT

## v0.17.3 - Tue, 19 Apr 2016 20:24:09 GMT

* [6c309e4](../../commit/6c309e4) [fixed] array.ensure()

## v0.17.2 - Tue, 19 Apr 2016 16:46:54 GMT

## v0.17.1 - Thu, 14 Apr 2016 19:12:22 GMT

* [ab78f54](../../commit/ab78f54) [fixed] reach with lazy()

## v0.17.0 - Thu, 14 Apr 2016 17:13:50 GMT

* [6e9046b](../../commit/6e9046b) [changed] clean up interface, added lazy(), and fixed object strict semantics

## v0.16.5 - Tue, 12 Apr 2016 13:36:38 GMT

* [c3b613b](../../commit/c3b613b) [added] strip() method for objects
* [68fc010](../../commit/68fc010) [added] array.of shorthand

## v0.16.4 - Sat, 09 Apr 2016 20:13:13 GMT

* [f30d1e3](../../commit/f30d1e3) [fixed] bug in date min/max with ref

## v0.16.3 - Thu, 07 Apr 2016 19:13:23 GMT

## v0.16.2 - Thu, 07 Apr 2016 17:57:44 GMT

* [83c0656](../../commit/83c0656) [added] meta() and describe()

## v0.16.1 - Tue, 05 Apr 2016 20:56:45 GMT

* [9d70a7b](../../commit/9d70a7b) [changed] doesn't throw when context is missing.
* [594fa53](../../commit/594fa53) [changed] added reach error

## v0.16.0 - Tue, 05 Apr 2016 20:17:40 GMT

* [75739b8](../../commit/75739b8) [added] context sensitive reach()

## v0.15.0 - Tue, 29 Mar 2016 14:56:15 GMT

* [3ae5fdc](../../commit/3ae5fdc) [changed] `null` is not considered an empty value for isValid
* [9eb42c6](../../commit/9eb42c6) [added] refs!

## v0.14.2 - Tue, 29 Mar 2016 14:48:37 GMT

## v0.14.1 - Tue, 16 Feb 2016 19:51:25 GMT

* [ff19720](../../commit/ff19720) [fixed] noUnknown and stripUnknown work and propagate to children

## v0.14.0 - Mon, 08 Feb 2016 16:17:40 GMT

* [86b6446](../../commit/86b6446) [fixed] camelCase should maintain leading underscores

## v0.13.0 - Mon, 01 Feb 2016 20:49:40 GMT

* [335eb18](../../commit/335eb18) [fixed] pass options to array sub schema
* [f7f631d](../../commit/f7f631d) [changed] oneOf doesn't include empty values
* [0a7b2d4](../../commit/0a7b2d4) [fixed] type and whitelist/blacklist checks threw inconsistent errors
* [1274a45](../../commit/1274a45) [changed] required() to non-exclusive

## v0.12.0 - Tue, 12 Jan 2016 19:12:18 GMT

* [5bc250f](../../commit/5bc250f) [changed] don't clone unspecified object keys
* [069c6fd](../../commit/069c6fd) [added] withMutation() method
* [e1d4891](../../commit/e1d4891) [fixed] don't alias non existent fields

## v0.11.0 - Sun, 08 Nov 2015 17:17:09 GMT

* [686f6b1](../../commit/686f6b1) [changed] concat() allows mixing "mixed" and other type

## 0.9.0

**breaking**

* `test` functions are no longer passed `path` and `context` as arguments, Instead they are now values on `this` inside the test function.
* test functions are longer called with the schema as their `this` value, use `this.schema` instead.

**other changes**

* test functions are call with with a new context object, including, options, parent and `createError` for dynamically altering validation errors.

## 0.8.3

* document `stripUnknown`
* add `recursive` option
* add `noUnknown()` test to objects

## 0.8.2

* default for objects now adds keys for all fields, not just fields with non empty defaults

## 0.8.1

* bug fix

## 0.8.0

**breaking**

* `test` functions are now passed `path` and `context` values along with the field value. Only breaks if using the callback style of defining custom validations

## 0.7.0

**breaking**

* the `validation()` method has been renamed to `test()` and has a new signature requiring a `name` argument
* exclusive validations now trump the previous one instead of defering to it e.g: `string().max(10).max(15)` has a max of `15` instead of `10`

**other changes**

* expose advanced signature for custom validation tests, gives finer grained control over how tests are added
* added the `abortEarly` (default: `true`) option
* transforms are passed an addition parameter: 'originalValue' you allow recovering from a bad transform further up the chain (provided no one mutated the value)

## 0.6.3

* fix `concat()` method and add tests

## 0.6.2

* fix validations where nullable fields were failing due to `null` values e.g `string.max()`

## 0.6.1

* fix export error

## 0.6.0

**breaking**

* Removed the `extend` and `create` methods. Use whatever javascript inheritance patterns you want instead.
* the resolution order of defaults and coercions has changed. as well as the general handling of `null` values.
  * Number: `null` will coerce to `false` when `nullable()` is not specified. `NaN` values will now fail `isType()` checks
  * String: `null` will coerce to `''` when `nullable()` is not specified
  * Date: Invalid dates will not be coerced to `null`, but left as invalid date, This is probably not a problem for anyone as invalid dates will also fail `isType()` checks
* default values are cloned everytime they are returned, so it is impossible to share references to defaults across schemas. No one should be doing that anyway
* stopped pretending that using schemas as conditions in `when()` actually worked (it didn't)

**other changes**

* `transform()` now passes the original value to each transformer. Allowing you to recover from a bad transform.
* added the `equals()` alias for `oneOf`
*

## 0.5.0

**breaking**

* isValid is now async, provide a node style callback, or use the promise the method returns to read the validity. This change allows for more robust validations, specifically remote ones for client code (or db queries for server code). The cast method is still, and will remain, synchronous.
*

**other changes**

* added validate method (also async) which resolves to the value, and rejects with a new ValidationError
