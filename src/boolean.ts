import MixedSchema from './mixed';

export function create() {
  return new BooleanSchema();
}

export default class BooleanSchema<TType extends boolean> extends MixedSchema<
  TType
> {
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

  protected _typeCheck(v: any): v is TType {
    if (v instanceof Boolean) v = v.valueOf();

    return typeof v === 'boolean';
  }
}
