import inherits from './util/inherits';
import MixedSchema from './mixed';
import isAbsent from './util/isAbsent';

// eslint-disable-next-line
let rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// eslint-disable-next-line
let rUrl = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

let hasLength = value => isAbsent(value) || value.length > 0;
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

  required(message = null) {
    var next = MixedSchema.prototype.required.call(this, message);

    return next.test({
      message,
      localePath: 'mixed.required',
      name: 'required',
      test: hasLength,
    });
  },

  length(length, message = null) {
    return this.test({
      message,
      localePath: 'string.length',
      name: 'length',
      exclusive: true,
      params: { length },
      test(value) {
        return isAbsent(value) || value.length === this.resolve(length);
      },
    });
  },

  min(min, message = null) {
    return this.test({
      message,
      localePath: 'string.min',
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min);
      },
    });
  },

  max(max, message = null) {
    return this.test({
      name: 'max',
      localePath: 'string.max',
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
    let localePath = 'string.matches';

    if (options) {
      if (
        options.message ||
        options.hasOwnProperty('excludeEmptyString') ||
        options.hasOwnProperty('localePath')
      ) {
        ({ excludeEmptyString, message, localePath } = options);
      } else message = options;
    }

    return this.test({
      message: message,
      localePath,
      params: { regex },
      test: value =>
        isAbsent(value) ||
        (value === '' && excludeEmptyString) ||
        regex.test(value),
    });
  },

  email(message = null) {
    return this.matches(rEmail, {
      message,
      localePath: 'string.email',
      excludeEmptyString: true,
    });
  },

  url(message = null) {
    return this.matches(rUrl, {
      message,
      localePath: 'string.url',
      excludeEmptyString: true,
    });
  },

  //-- transforms --
  ensure() {
    return this.default('').transform(val => (val === null ? '' : val));
  },

  trim(message = null) {
    return this.transform(val => (val != null ? val.trim() : val)).test({
      message,
      localePath: 'string.trim',
      name: 'trim',
      test: isTrimmed,
    });
  },

  lowercase(message = null) {
    return this.transform(
      value => (!isAbsent(value) ? value.toLowerCase() : value),
    ).test({
      message,
      localePath: 'string.lowercase',
      name: 'string_case',
      exclusive: true,
      test: value => isAbsent(value) || value === value.toLowerCase(),
    });
  },

  uppercase(message = null) {
    return this.transform(
      value => (!isAbsent(value) ? value.toUpperCase() : value),
    ).test({
      message,
      localePath: 'string.uppercase',
      name: 'string_case',
      exclusive: true,
      test: value => isAbsent(value) || value === value.toUpperCase(),
    });
  },
});
