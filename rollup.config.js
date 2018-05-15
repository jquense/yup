const nodeResolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const { sizeSnapshot } = require('rollup-plugin-size-snapshot');

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
    'lodash/has',
    'lodash/cloneDeepWith',
    'lodash/toArray',
    'lodash/mapKeys',
    'lodash/mapValues',
    'lodash/snakeCase',
    'lodash/camelCase',
    'toposort',
    'fn-name',
    'synchronous-promise',
    'property-expr',
  ],
};

module.exports = [
  {
    ...base,
    output: {
      file: 'dist/yup.js',
      format: 'cjs',
    },
    plugins: [...base.plugins, sizeSnapshot()],
  },
  {
    ...base,
    output: {
      file: 'dist/yup.esm.js',
      format: 'es',
    },
  },
];
