import inherits from './util/inherits';
import MixedSchema from './mixed';
import { boolean as locale } from './locale';
import isAbsent from './util/isAbsent';

export default BooleanSchema;

function BooleanSchema() {
  if (!(this instanceof BooleanSchema)) return new BooleanSchema();

  MixedSchema.call(this, { type: 'boolean' });

  this.withMutation(() => {
    this.transform(function(value) {
      if (!this.isType(value)) {
        if (/^(true|1)$/i.test(value)) return true;
        if (/^(false|0)$/i.test(value)) return false;
      }
      return value;
    });
  });
}

inherits(BooleanSchema, MixedSchema, {
  _typeCheck(v) {
    if (v instanceof Boolean) v = v.valueOf();

    return typeof v === 'boolean';
  },

  isTrue(message = locale.isValue) {
    return this.test({
      message,
      name: 'is-value',
      exclusive: true,
      params: { value: 'true' },
      test(value) {
        return isAbsent(value) || value === true;
      },
    });
  },

  isFalse(message = locale.isValue) {
    return this.test({
      message,
      name: 'is-value',
      exclusive: true,
      params: { value: 'false' },
      test(value) {
        return isAbsent(value) || value === false;
      },
    });
  },
});
