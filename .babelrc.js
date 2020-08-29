module.exports = (api) => ({
  presets: [
    [
      'babel-preset-jason/esm',
      api.env() !== 'test'
        ? {
            ignoreBrowserslistConfig: true,
            modules: api.env() === 'modules' ? false : 'commonjs',
          }
        : {
            target: 'node',

            debug: true,
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
