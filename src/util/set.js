var toString = Object.prototype.toString
var isDate = obj => toString.call(obj) === '[object Date]'

module.exports =  class BadSet {

  constructor(){
    this._array = []
    this.length = 0
  }

  values(){
    return this._array
  }

  add(item) {
    if(!this.has(item)) 
      this._array.push(item)

    this.length = this._array.length
  }

  delete(item){
    var idx = indexOf(this._array, item)
    if( idx !== -1) 
      this._array.splice(idx, 1)

    this.length = this._array.length
  }

  has(val){
    return indexOf(this._array, val) !== -1
  }
}


function indexOf(arr, val){
  for (var i = 0; i < arr.length; i++) {
    var item = arr[i]
    if (item === val || (isDate(item) && +val === +item)) 
      return i
  }
  return -1
}