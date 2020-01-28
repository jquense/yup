var baseConfig = {
  presets: [['jason', { debug: true, ignoreBrowserslistConfig: true }]],
  env: {
    modules: {
      presets: [
        [
          'jason',
          { debug: true, ignoreBrowserslistConfig: true, modules: false },
        ],
      ],
    },
    test: {
      sourceMaps: 'inline',
      presets: [
        [
          'jason',
          {
            target: 'node',
            targets: { node: 'current' },
          },
        ],
      ],
    },
  },
};

module.exports = function(api) {
  var configCopy = Object.assign({}, baseConfig);
  if (api.env('modules')) {
    configCopy.plugins = [
      [
        'transform-rename-import',
        {
          original: 'lodash',
          replacement: 'lodash-es',
        },
      ],
    ];
  }
  return configCopy;
};
