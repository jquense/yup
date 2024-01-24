# Extending Schema

For simple cases where you want to reuse common schema configurations, creating
and passing around instances works great and is automatically typed correctly

```js
import * as yup from 'yup';

const requiredString = yup.string().required().default('');

const momentDate = (parseFormats = ['MMM dd, yyy']) =>
  yup.date().transform(function (value, originalValue) {
    if (this.isType(value)) return value;

    // the default coercion transform failed so let's try it with Moment instead
    value = Moment(originalValue, parseFormats);
    return value.isValid() ? value.toDate() : yup.date.INVALID_DATE;
  });

export { momentDate, requiredString };
```

Schema are immutable so each can be configured further without changing the original.

## Extending Schema with new methods

`yup` provides a `addMethod()` utility for extending built-in schema:

```js
function parseDateFromFormats(formats, parseStrict) {
  return this.transform(function (value, originalValue) {
    if (this.isType(value)) return value;

    value = Moment(originalValue, formats, parseStrict);

    return value.isValid() ? value.toDate() : yup.date.INVALID_DATE;
  });
}

yup.addMethod(yup.date, 'format', parseDateFromFormats);
```

Note that `addMethod` isn't magic, it mutates the prototype of the passed in schema.

> Note: if you are using TypeScript you also need to adjust the class or interface
> see the [typescript](./typescript.md) docs for details.

## Creating new Schema types

If you're using case calls for creating an entirely new type, inheriting from
an existing schema class may be best: Generally you should not be inheriting from
the abstract `Schema` unless you know what you are doing. The other types are fair game though.

You should keep in mind some basic guidelines when extending schemas:

- never mutate an existing schema, always `clone()` and then mutate the new one before returning it.
  Built-in methods like `test` and `transform` take care of this for you, so you can safely use them (see below) without worrying

- transforms should never mutate the `value` passed in, and should return an invalid object when one exists
  (`NaN`, `InvalidDate`, etc) instead of `null` for bad values.

- by the time validations run, the `value` is guaranteed to be the correct type, however it still may
  be `null` or `undefined`

```js
import { DateSchema } from 'yup';

class MomentDateSchema extends DateSchema {
  static create() {
    return MomentDateSchema();
  }

  constructor() {
    super();
    this._validFormats = [];

    this.withMutation(() => {
      this.transform(function (value, originalvalue) {
        if (this.isType(value))
          // we have a valid value
          return value;
        return Moment(originalValue, this._validFormats, true);
      });
    });
  }

  _typeCheck(value) {
    return (
      super._typeCheck(value) || (moment.isMoment(value) && value.isValid())
    );
  }

  format(formats) {
    if (!formats) throw new Error('must enter a valid format');
    let next = this.clone();
    next._validFormats = {}.concat(formats);
  }
}

let schema = new MomentDateSchema();

schema.format('YYYY-MM-DD').cast('It is 2012-05-25'); // => Fri May 25 2012 00:00:00 GMT-0400 (Eastern Daylight Time)
```
