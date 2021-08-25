import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src-generated-js/main.js',
  output: {
    file: 'fsbundle-main.js',
    format: 'esm',
  },
  plugins: [resolve({ preferBuiltins: false }), commonjs(), babel({ babelHelpers: 'bundled' }), terser()],
};
