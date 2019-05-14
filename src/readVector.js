import { Pbf as Protobuf } from 'pbf';
import { VectorTile } from 'vector-tile-js';

export function readMVT(dataHref, callback) {
  // Input dataHref is the path to a file containing a Mapbox Vector Tile

  // Request the data
  var request = new XMLHttpRequest();
  request.onerror = requestError;
  request.open('get', dataHref);
  request.responseType = "arraybuffer"; // WARNING: not supported by iOS Safari?
  request.onload = parseMVT;
  request.send();

  function parseMVT() {
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

  function requestError(err) {
    callback("XMLHttpRequest Error: " + err, null);
  }
}

export function readGeoJSON(dataHref, callback) {
  // Input dataHref is the path to a file containing GeoJSON data

  // Request the data
  var request = new XMLHttpRequest();
  request.onerror = requestError;
  request.open('get', dataHref);
  // Load the response as text, since Edge doesn't support json responseType
  request.responseType = "text";
  request.onload = parseJSON;
  request.send();

  function parseJSON() {
    callback( null, JSON.parse(this.responseText) );
  }

  function requestError(err) {
    callback("XMLHttpRequest Error: " + err, null);
  }
}
