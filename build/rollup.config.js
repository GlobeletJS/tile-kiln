import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'; // Yuck... remove when possible
import pkg from "../package.json";
import builtins from 'rollup-plugin-node-builtins';

export default [{
  input: 'src/main.js',
  plugins: [
    commonjs({
      namedExports: { 'geotiff.js': ['GeoTIFF'] }
    }),
    resolve(),
    builtins(),
  ],
  output: {
    file: pkg.main,
    //sourcemap: 'inline',
    format: 'esm',
    name: pkg.name
  }
}, {
  input: 'src/load-mvt/worker.js',
  plugins: [
    resolve(),
    commonjs(),
  ],
  output: {
    file: 'dist/worker.bundle.js',
    format: 'esm',
    name: pkg.name,
  },
}];
