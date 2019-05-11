import resolve from 'rollup-plugin-node-resolve';
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
  ],
  output: {
    file: 'mvt/main.min.js',
    format: 'iife',
    name: 'mvt',
  },
}];
