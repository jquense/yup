var { has } = require('./_')

module.exports = class BadSet {

  constructor(){
    this._map = Object.create(null)
    this._refs = Object.create(null)
  }

  values(){
    return Object.keys(this._map).map(v => this._map[v])
  }

  get length(){
    return Object.keys(this._map).length
  }

  add(item){
    this._map[stringify(item)] = item
  }

  delete(item){
    delete this._map[stringify(item)]
  }

  has(item){
    return has(this._map, stringify(item))
  }
}

function stringify(item){
  return JSON.stringify(item)
}
