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
    'lodash.camelcase',
    'lodash.clonedeepwith',
    'lodash.has',
    'lodash.mapkeys',
    'lodash.mapvalues',
    'lodash.snakecase',
    'lodash.toarray',
    'toposort',
    'fn-name',
    'synchronous-promise',
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
