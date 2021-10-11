module.exports = (api) => ({
  presets: [
    [
      'babel-preset-jason/esm',
      api.env() !== 'test'
        ? {
            ignoreBrowserslistConfig: true,
            modules: api.env() === 'esm' ? false : 'commonjs',
          }
        : {
            target: 'node',

            // debug: true,
            targets: { node: 'current' },
          },
    ],
    ['@babel/preset-typescript', { allowDeclareFields: true }],
  ],
  plugins: ['@babel/plugin-proposal-logical-assignment-operators'],
});
