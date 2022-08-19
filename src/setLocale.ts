import locale, { LocaleObject } from './locale';

export type { LocaleObject };

export default function setLocale(custom: LocaleObject) {
  Object.keys(custom).forEach((type) => {
    // @ts-ignore
    Object.keys(custom[type]!).forEach((method) => {
      // @ts-ignore
      locale[type][method] = custom[type][method];
    });
  });
}
