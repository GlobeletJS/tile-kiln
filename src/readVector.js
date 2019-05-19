import { Pbf as Protobuf } from 'pbf';
import { VectorTile } from 'vector-tile-js';

export function readMVT(dataHref, callback) {
  // Input dataHref is the path to a file containing a Mapbox Vector Tile

  // Request the data
  xhrGet(dataHref, "arraybuffer", parseMVT);

  function parseMVT(err) {
    if (this.responseType !== "arraybuffer") {
      var err = "Wrong responseType. Expected arraybuffer, got " + 
        this.responseType;
      callback(err, null);
      return;
    }
    const pbuffer = new Protobuf( new Uint8Array(this.response) );
    const tile = new VectorTile(pbuffer);
    callback(null, tile);
  }
}

export function readJSON(dataHref, callback) {
  // Input dataHref is the path to a file containing JSON

  // Request the data - as text, since Edge doesn't support json responseType
  xhrGet(dataHref, "text", parseJSON);

  function parseJSON(err) {
    callback( null, JSON.parse(this.responseText) );
  }
}

function xhrGet(href, type, callback) {
  var req = new XMLHttpRequest();
  req.onerror = reqError;
  req.open('get', href);
  req.responseType = type;
  req.onload = callback;
  req.send();

  function reqError(err) {
    // Not sure how to pass this to the callback? Need 2 callbacks?
    console.log("XMLHttpRequest Error: " + err);
  }
  return req;
}
