import inherits from './util/inherits';
import MixedSchema from './mixed';
import { string as locale } from './locale';

// eslint-disable-next-line
let rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// eslint-disable-next-line
let rUrl = /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

export default function StringSchema() {
  if (!(this instanceof StringSchema)) return new StringSchema();

  MixedSchema.call(this, { type: 'string' });

  this.withMutation(() => {
    this.transform(function(value) {
      if (this.isType(value)) return value;
      return value != null && value.toString ? value.toString() : value;
    });
  });
}

inherits(StringSchema, MixedSchema, {
  _typeCheck(value) {
    if (value instanceof String) value = value.valueOf();

    return typeof value === 'string';
  },

  _isFilled(value) {
    return value.length > 0;
  },

  length(length, message = locale.length) {
    return this.test({
      message,
      name: 'length',
      exclusive: true,
      params: { length },
      skipAbsent: true,
      test(value) {
        return value.length === this.resolve(length);
      },
    });
  },

  min(min, message = locale.min) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      skipAbsent: true,
      test(value) {
        return value.length >= this.resolve(min);
      },
    });
  },

  max(max, message = locale.max) {
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      skipAbsent: true,
      test(value) {
        return value.length <= this.resolve(max);
      },
    });
  },

  matches(regex, options = {}) {
    if (typeof options === 'string' || typeof options === 'function') {
      options = { message: options };
    }

    let {
      message = locale.matches,
      name = 'matches',
      exclusive = false,
      excludeEmptyString = false,
    } = options;

    return this.test({
      message,
      name,
      exclusive,
      params: { regex },
      skipAbsent: true,
      test: value => (value === '' && excludeEmptyString) || regex.test(value),
    });
  },

  email(message = locale.email) {
    return this.matches(rEmail, {
      message,
      name: 'email',
      exclusive: true,
      excludeEmptyString: true,
    });
  },

  url(message = locale.url) {
    return this.matches(rUrl, {
      message,
      name: 'url',
      exclusive: true,
      excludeEmptyString: true,
    });
  },

  //-- transforms --
  ensure() {
    return this.clone(next => {
      next.default('');
      next.transform(value => (value === null ? '' : value));
    });
  },

  trim(message = locale.trim) {
    return this.clone(next => {
      next.transform(value => value && value.trim());
      next.test({
        message,
        name: 'trim',
        exclusive: true,
        skipAbsent: true,
        test: value => value === value.trim(),
      });
    });
  },

  _case(name, transform, message) {
    return this.clone(next => {
      next.transform(value => value && transform(value));
      next.test({
        message,
        name: 'case',
        exclusive: true,
        params: { name },
        skipAbsent: true,
        test: value => value === transform(value),
      });
    });
  },

  lowercase(message = locale.lowercase) {
    return this._case('lowercase', value => value.toLowerCase(), message);
  },

  uppercase(message = locale.uppercase) {
    return this._case('uppercase', value => value.toUpperCase(), message);
  },
});
