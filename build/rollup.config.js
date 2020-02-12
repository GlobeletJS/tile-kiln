import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'; // Yuck... remove when possible
import pkg from "../package.json";
import builtins from 'rollup-plugin-node-builtins';

export default [{
  input: 'src/main.js',
  plugins: [
    commonjs({
     // namedExports: { 'geotiff.js': ['GeoTIFF'] }
      }),
    resolve({
      browser: true,
      preferBuiltins: true,
    }),
    builtins(),
  ],
  output: {
    file: pkg.main,
    //sourcemap: 'inline',
    format: 'esm',
    name: pkg.name
  }
}];
