import locale from './locale';

export function setLocale(custom){
  Object.keys(custom).forEach(type => {
    Object.keys(custom[type]).forEach(method => {
      locale[type][method] = custom[type][method]
    })
  })
}
