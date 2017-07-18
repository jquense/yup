let dict = {}

export function setLocale(custom){
  return (dict = { ...dict, ...custom })
}

export function getLocale(){
  return dict
}
