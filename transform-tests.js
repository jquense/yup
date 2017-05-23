const { createTransformer } = require('babel-jest')

module.exports = createTransformer({
  babelrc: false,
  sourceMaps: 'inline',
  presets: [
    [
      'jason',
      {
        'debug': false,
        'target': 'node',
        'targets': { 'node': '7.10' }
      }
    ]
  ]
});
