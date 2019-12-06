import { xhrGet } from "./xhrGet.js";
import Protobuf from 'pbf';
import { VectorTile } from 'vector-tile-esm';

export function readMVT(dataHref, size, callback) {
  // Input dataHref is the path to a file containing a Mapbox Vector Tile

  // Request the data
  var req = xhrGet(dataHref, "arraybuffer", parseMVT);

  // Return the request, so it can be aborted if necessary
  return req;

  function parseMVT(err, data) {
    if (err) return callback(err, data);

    const tile = new VectorTile(new Protobuf(data));
    const jsonLayers = mvtToJSON(tile, size);

    callback(null, jsonLayers);
  }
}

function mvtToJSON(tile, size) {
  // tile.layers is an object (not array!). In Mapbox Streets, it is an object
  // of { name: layer } pairs, where name = layer.name. 
  // But this is not mentioned in the spec! So we use layer.name for safety
  const jsonLayers = {};
  Object.values(tile.layers).forEach(layer => {
    jsonLayers[layer.name] = layer.toGeoJSON(size);
  });
  return jsonLayers;
}
