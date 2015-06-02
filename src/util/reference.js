

class Reference {
  constructor(string) {
    this._deps = []
  }

  default() {}
  
  cast(value, parent, options){
    return parent.default(undefined).cast(value, options)
  }
}