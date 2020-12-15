const nodeResolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const filesize = require('rollup-plugin-filesize');

const base = {
  input: './src/index.js',
  plugins: [
    nodeResolve(),
    babel({
      babelrc: false,
      presets: [['jason', { modules: false, runtime: false }]],
    }),
  ],
  external: [
    'lodash/snakeCase',
    'lodash/camelCase',
    'toposort',
    'fn-name',
    'property-expr',
  ],
};

module.exports = [
  {
    ...base,
    output: [
      {
        file: 'dist/yup.js',
        format: 'cjs',
      },
      {
        file: 'dist/yup.esm.js',
        format: 'es',
      },
    ],
    plugins: [...base.plugins, filesize()],
  },
];
