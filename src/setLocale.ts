import locale, { LocaleObject } from './locale';

export default function setLocale(custom: LocaleObject) {
  Object.keys(custom).forEach(type => {
    Object.keys(custom[type]).forEach(method => {
      locale[type][method] = custom[type][method];
    });
  });
}
