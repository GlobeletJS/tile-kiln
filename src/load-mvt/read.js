import { xhrGet } from "./xhrGet.js";
import Protobuf from 'pbf';
import { VectorTile } from 'vector-tile-js';

export function readMVT(dataHref, size, callback) {
  // Input dataHref is the path to a file containing a Mapbox Vector Tile

  // Request the data
  var req = xhrGet(dataHref, "arraybuffer", parseMVT);

  // Return the request, so it can be aborted if necessary
  return req;

  function parseMVT(err, data) {
    if (err) return callback(err, data);

    const pbuffer = new Protobuf( new Uint8Array(data) );
    const tile = new VectorTile(pbuffer);
    const jsonLayers = mvtToJSON(tile, size);

    callback(null, jsonLayers);
  }
}

function mvtToJSON(tile, size) {
  // tile.layers is an object (not array!). In Mapbox Streets, it is an
  // object of { name: layer, } pairs, where name = layer.name. 
  // But this is not mentioned in the spec! So we use layer.name for safety
  const jsonLayers = {};
  Object.values(tile.layers).forEach(layer => {
    jsonLayers[layer.name] = layerToJSON(layer, size);
  });
  return jsonLayers;
}

function layerToJSON(layer, size) {
  const getFeature = (i) => layer.feature(i).toGeoJSON(size);
  const features = Array.from(Array(layer.length), (v, i) => getFeature(i));

  return { type: "FeatureCollection", features: features };
}
