import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';
import filesize from 'rollup-plugin-filesize';

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
  external: ['tiny-case', 'toposort', 'fn-name', 'property-expr'],
};

module.exports = [
  {
    input: './dts/index.d.ts',
    output: [{ file: 'lib/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
  {
    ...base,
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
];
