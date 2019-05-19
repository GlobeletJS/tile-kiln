import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'; // Yuck... needed for iee754 package
import json from 'rollup-plugin-json';

export default [{
  input: 'counties/main.js',
  plugins: [
    resolve(),
    json(),
  ],
  output: {
    file: 'counties/main.min.js',
    format: 'iife',
    name: 'counties',
  },
}, {
  input: 'mvt/main.js',
  plugins: [
    resolve(),
    commonjs(),
  ],
  output: {
    file: 'mvt/main.min.js',
    format: 'iife',
    name: 'mvt',
  },
}];
