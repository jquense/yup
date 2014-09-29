var Clank = require('clank');

module.exports = Clank.Object.extend({

  constructor: function DataAccessObject(){
    this.path = ''
    this.errors = []
    Clank.Object.call(this)
  },

  cast: Clank.required,

  default: Clank.required,

  isValid: Clank.required

})