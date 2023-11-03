import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';
import filesize from 'rollup-plugin-filesize';
import commonJS from 'rollup-plugin-commonjs';

const base = {
  input: './src/index.ts',
  plugins: [
    nodeResolve({ extensions: ['.js', '.ts'] }),
    babel({
      babelrc: true,
      envName: 'esm',
      extensions: ['.js', '.ts'],
    }),
  ],
};

module.exports = [
  {
    input: './dts/index.d.ts',
    output: [{ file: 'lib/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
  {
    ...base,
    external: ['tiny-case', 'toposort', 'fn-name', 'property-expr'],
    output: [
      {
        file: 'lib/index.js',
        format: 'cjs',
      },
      {
        file: 'lib/index.esm.js',
        format: 'es',
      },
    ],
    plugins: [...base.plugins, filesize()],
  },
  {
    ...base,
    output: [
      {
        file: 'lib/index.umd.js',
        format: 'umd',
        name: 'yup',
      },
    ],
    plugins: [
      ...base.plugins,
      filesize(),
      commonJS({
        include: ['node_modules/tiny-case/**', 'node_modules/toposort/**', 'node_modules/fn-name/**', 'node_modules/property-expr/**']
      }),
    ],
  },
];
