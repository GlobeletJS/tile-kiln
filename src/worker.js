import { xhrGet } from "./xhrGet.js";
import { Pbf as Protobuf } from 'pbf';
import { VectorTile } from 'vector-tile-js';

onmessage = function(msgEvent) {
  // The message DATA as sent by the parent thread is now a property 
  // of the message EVENT. See
  // https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
  const {id, payload} = msgEvent.data;

  readMVT(payload.href, payload.size, returnResult);

  function returnResult(err, result) {
    postMessage({ id, err, payload: result });
  }
}

function readMVT(dataHref, size, callback) {
  // Input dataHref is the path to a file containing a Mapbox Vector Tile

  // Request the data
  xhrGet(dataHref, "arraybuffer", parseMVT);

  function parseMVT(err, data) {
    if (err) return (err.type === 404)
      ? callback(null, {})           // Tile out of bounds? Don't rock the boat
      : callback(err.message, data); // Other problems... return the whole mess

    //console.time('parseMVT');
    const pbuffer = new Protobuf( new Uint8Array(data) );
    const tile = new VectorTile(pbuffer);
    const jsonLayers = mvtToJSON(tile, size);
    //console.timeEnd('parseMVT');

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
  const features = [];
  for (let i = 0; i < layer.length; ++i) {
    features.push( layer.feature(i).toGeoJSON(size) );
  }
  return { type: "FeatureCollection", features: features };
}
