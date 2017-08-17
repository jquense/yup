const { createTransformer } = require('babel-jest')

module.exports = createTransformer({
  babelrc: false,
  sourceMaps: 'inline',
  plugins: [
    'transform-flow-strip-types'
  ],
  presets: [
    [
      'jason',
      {
        'debug': false,
        'target': 'node',
        'targets': { 'node': 'current' }
      }
    ]
  ]
});
