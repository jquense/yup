module.exports = api => ({
  presets: [
    [
      'jason',
      api.env() !== 'test'
        ? {
            ignoreBrowserslistConfig: true,
            modules: api.env() === 'modules' ? false : 'commonjs',
          }
        : {
            target: 'node',
            targets: { node: 'current' },
          },
    ],
  ],
  plugins: [
    api.env() === 'modules' && [
      'transform-rename-import',
      {
        original: 'lodash',
        replacement: 'lodash-es',
      },
    ],
  ].filter(Boolean),
});
