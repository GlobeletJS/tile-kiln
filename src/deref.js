// From mapbox-gl-js, style-spec/deref.js
const refProperties = [
  'type', 
  'source', 
  'source-layer', 
  'minzoom', 
  'maxzoom', 
  'filter', 
  'layout'
];

/**
 * Given an array of layers, some of which may contain `ref` properties
 * whose value is the `id` of another property, return a new array where
 * such layers have been augmented with the 'type', 'source', etc. properties
 * from the parent layer, and the `ref` property has been removed.
 *
 * The input is not modified. The output may contain references to portions
 * of the input.
 *
 * @private
 * @param {Array<Layer>} layers
 * @returns {Array<Layer>}
 */
export function derefLayers(layers) {
  layers = layers.slice(); // ??? What are we trying to achieve here?

  const map = Object.create(null); // stackoverflow.com/a/21079232/10082269
  for (let i = 0; i < layers.length; i++) {
    map[layers[i].id] = layers[i];
  }

  for (let i = 0; i < layers.length; i++) {
    if ('ref' in layers[i]) {
      layers[i] = deref(layers[i], map[layers[i].ref]);
    }
  }

  return layers;
}

function deref(layer, parent) {
  const result = {};

  for (const k in layer) {
    if (k !== 'ref') {
      result[k] = layer[k];
    }
  }

  refProperties.forEach((k) => {
    if (k in parent) {
      result[k] = parent[k];
    }
  });

  return result;
}
