
module.exports = function has(o, k) {
  return o ? Object.prototype.hasOwnProperty.call(o, k) : false;
};