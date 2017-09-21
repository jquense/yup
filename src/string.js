/* eslint-disable no-param-reassign */
import inherits from './util/inherits';
import MixedSchema from './mixed';
import { mixed, string as locale } from './locale';
import isAbsent from './util/isAbsent';

/* eslint-disable no-useless-escape, no-control-regex */
const rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
const rUrl = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
/* eslint-enable no-useless-escape, no-control-regex */

const hasLength = value => isAbsent(value) || value.length > 0;
const isTrimmed = value => isAbsent(value) || value === value.trim();

export default function StringSchema() {
  if (!(this instanceof StringSchema)) { return new StringSchema(); }

  MixedSchema.call(this, { type: 'string' });

  this.withMutation(() => {
    this.transform(function transform(value) {
      if (this.isType(value)) return value;
      return value != null && value.toString
        ? value.toString()
        : value;
    });
  });
}

inherits(StringSchema, MixedSchema, {
  _typeCheck(value) {
    if (value instanceof String) {
      value = value.valueOf();
    }

    return typeof value === 'string';
  },

  required(msg) {
    const next = MixedSchema.prototype
      .required.call(this, msg || mixed.required);

    return next.test(
      'required'
      , msg || mixed.required
      , hasLength,
    );
  },

  length(length, msg) {
    return this.test({
      name: 'length',
      exclusive: true,
      message: msg || locale.length,
      params: { length },
      test(value) {
        return isAbsent(value) || value.length === this.resolve(length);
      },
    });
  },

  min(min, msg) {
    return this.test({
      name: 'min',
      exclusive: true,
      message: msg || locale.min,
      params: { min },
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min);
      },
    });
  },

  max(max, msg) {
    return this.test({
      name: 'max',
      exclusive: true,
      message: msg || locale.max,
      params: { max },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max);
      },
    });
  },

  matches(regex, options = {}) {
    let excludeEmptyString = false;
    let message;

    if (options.message || Object.prototype.hasOwnProperty.call(options, 'excludeEmptyString')) {
      ({ excludeEmptyString, message } = options);
    } else { message = options; }

    return this.test({
      message: message || locale.matches,
      params: { regex },
      test: value => (
        isAbsent(value) ||
        (value === '' && excludeEmptyString) ||
        regex.test(value)
      ),
    });
  },

  email(msg) {
    return this.matches(rEmail, {
      message: msg || locale.email,
      excludeEmptyString: true,
    });
  },

  url(msg) {
    return this.matches(rUrl, {
      message: msg || locale.url,
      excludeEmptyString: true,
    });
  },

  // -- transforms --
  ensure() {
    return this
      .default('')
      .transform(val => (val === null ? '' : val));
  },

  trim(msg) {
    msg = msg || locale.trim;

    return this
      .transform(val => (val != null ? val.trim() : val))
      .test('trim', msg, isTrimmed);
  },

  lowercase(msg) {
    return this
      .transform(value => (!isAbsent(value) ? value.toLowerCase() : value))
      .test({
        name: 'string_case',
        exclusive: true,
        message: msg || locale.lowercase,
        test: value => isAbsent(value) || value === value.toLowerCase(),
      });
  },

  uppercase(msg) {
    return this
      .transform(value => (!isAbsent(value) ? value.toUpperCase() : value))
      .test({
        name: 'string_case',
        exclusive: true,
        message: msg || locale.uppercase,
        test: value => isAbsent(value) || value === value.toUpperCase(),
      });
  },
});
