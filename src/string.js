import inherits from './util/inherits';
import MixedSchema from './mixed';
import { string as locale } from './locale';
import isAbsent from './util/isAbsent';

// eslint-disable-next-line
let rEmail = /^(?=.{1,64}@)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(?=.{1,255}$)((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
// eslint-disable-next-line
let rUrl = /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

let isTrimmed = value => isAbsent(value) || value === value.trim();

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

  _isPresent(value) {
    return MixedSchema.prototype._cast.call(this, value) && value.length > 0;
  },

  length(length, message = locale.length) {
    return this.test({
      message,
      name: 'length',
      exclusive: true,
      params: { length },
      test(value) {
        return isAbsent(value) || value.length === this.resolve(length);
      },
    });
  },

  min(min, message = locale.min) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min);
      },
    });
  },

  max(max, message = locale.max) {
    return this.test({
      name: 'max',
      exclusive: true,
      message,
      params: { max },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max);
      },
    });
  },

  matches(regex, options) {
    let excludeEmptyString = false;
    let message;
    let name;

    if (options) {
      if (
        options.message ||
        options.hasOwnProperty('excludeEmptyString') ||
        options.name
      ) {
        ({ excludeEmptyString, message, name } = options);
      } else message = options;
    }

    return this.test({
      name: name || 'matches',
      message: message || locale.matches,
      params: { regex },
      test: value =>
        isAbsent(value) ||
        (value === '' && excludeEmptyString) ||
        value.search(regex) !== -1,
    });
  },

  email(message = locale.email) {
    return this.matches(rEmail, {
      name: 'email',
      message,
      excludeEmptyString: true,
    });
  },

  url(message = locale.url) {
    return this.matches(rUrl, {
      name: 'url',
      message,
      excludeEmptyString: true,
    });
  },

  //-- transforms --
  ensure() {
    return this.default('').transform(val => (val === null ? '' : val));
  },

  trim(message = locale.trim) {
    return this.transform(val => (val != null ? val.trim() : val)).test({
      message,
      name: 'trim',
      test: isTrimmed,
    });
  },

  lowercase(message = locale.lowercase) {
    return this.transform(value =>
      !isAbsent(value) ? value.toLowerCase() : value,
    ).test({
      message,
      name: 'string_case',
      exclusive: true,
      test: value => isAbsent(value) || value === value.toLowerCase(),
    });
  },

  uppercase(message = locale.uppercase) {
    return this.transform(value =>
      !isAbsent(value) ? value.toUpperCase() : value,
    ).test({
      message,
      name: 'string_case',
      exclusive: true,
      test: value => isAbsent(value) || value === value.toUpperCase(),
    });
  },
});
