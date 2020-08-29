import MixedSchema from './mixed';

export default class BooleanSchema extends MixedSchema {
  static create(options) {
    return new BooleanSchema(options);
  }

  constructor() {
    super({ type: 'boolean' });

    this.withMutation(() => {
      this.transform(function (value) {
        if (!this.isType(value)) {
          if (/^(true|1)$/i.test(value)) return true;
          if (/^(false|0)$/i.test(value)) return false;
        }
        return value;
      });
    });
  }
  _typeCheck(v) {
    if (v instanceof Boolean) v = v.valueOf();

    return typeof v === 'boolean';
  }
}
