import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src-generated-js/main-react.js',
  output: {
    file: 'fsbundle-react.js',
    format: 'esm',
  },
  plugins: [
    resolve({ preferBuiltins: false }),
    commonjs(),
    babel({ babelHelpers: 'bundled' }),
    terser({
      mangle: {
        reserved: ['FallingStarsGameData', 'updateContainer'],
      },
    }),
  ],
};
