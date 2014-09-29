var Clank = require('clank');

module.exports = Clank.Object.extend({

  constructor: function DataAccessObject(){
    Clank.Object.call(this)
  },

  cast: Clank.required,

  default: Clank.required,

  isValid: Clank.required,

  errors: Clank.required
})