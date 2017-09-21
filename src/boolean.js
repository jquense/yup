/* eslint-disable no-param-reassign */
import inherits from './util/inherits';
import MixedSchema from './mixed';

export default function BooleanSchema() {
  if (!(this instanceof BooleanSchema)) { return new BooleanSchema(); }

  MixedSchema.call(this, { type: 'boolean' });

  this.withMutation(() => {
    this.transform(function transform(value) {
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
});
