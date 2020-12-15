import locale from './locale';

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

type Locale = DeepPartial<typeof locale>;

export default function setLocale(custom: Locale) {
  Object.keys(custom).forEach((type) => {
    // @ts-ignore
    Object.keys(custom[type]!).forEach((method) => {
      // @ts-ignore
      locale[type][method] = custom[type][method];
    });
  });
}
