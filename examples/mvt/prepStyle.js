import { readJSON } from "./readVector.js";
import { derefLayers } from "./deref.js";

const mbToken = "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";

export function prepStyle(err, styleDoc, callback) {
  if (err) return callback(err);
  styleDoc.layers = derefLayers(styleDoc.layers);

  // Prepare the "sources" object
  var sKeys = Object.keys(styleDoc.sources);
  var numDone = 0;
  sKeys.forEach( key => prepSource(styleDoc.sources, key, moveOn) );
    
  function moveOn(err) {
    if (err) return callback(err);
    numDone ++;
    if (numDone == sKeys.length) callback(null, styleDoc);
  }
}

function prepSource(sources, key, callback) {
  var source = sources[key];
  var url = source.url;
  if (url === undefined) return callback(null); // No change

  url = expandURL(url, mbToken);
  readJSON(url, merge);

  function merge(err, json) {
    if (err) callback(err);
    // Add any custom properties from the style document
    Object.keys(source).forEach( k2 => { json[k2] = source[k2]; } );
    // Replace current entry with the TileJSON data
    sources[key] = json;
    callback(null);
  }
}

function expandURL(url, token) {
  var prefix = /^mapbox:\/\//;
  if ( !url.match(prefix) ) return url;
  var apiRoot = "https://api.mapbox.com/v4/";
  return url.replace(prefix, apiRoot) + ".json?secure&access_token=" + token;
}
