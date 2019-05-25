import { readJSON } from "./read.js";
import { derefLayers } from "./deref.js";

export function loadStyle(styleHref, mapboxToken, callback) {
  var url = expandStyleURL(styleHref, mapboxToken);
  var process = (err, doc) => prepStyle(err, doc, mapboxToken, callback);
  return readJSON(url, process);
}

export function prepStyle(err, styleDoc, token, callback) {
  if (err) return callback(err);
  styleDoc.layers = derefLayers(styleDoc.layers);

  // Prepare the "sources" object
  var sKeys = Object.keys(styleDoc.sources);
  var numToDo = sKeys.length;
  sKeys.forEach( key => prepSource(styleDoc.sources, key, token, finishAll) );
    
  function finishAll(err) {
    if (err) return callback(err);
    if (--numToDo == 0) callback(null, styleDoc);
  }
}

function prepSource(sources, key, mbToken, callback) {
  var source = sources[key];
  var url = source.url;
  if (url === undefined) return callback(null); // No change

  // Load the referenced TileJSON document
  url = expandTileURL(url, mbToken);
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

function expandStyleURL(url, token) {
  var prefix = /^mapbox:\/\/styles\//;
  if ( !url.match(prefix) ) return url;
  var apiRoot = "https://api.mapbox.com/styles/v1/";
  return url.replace(prefix, apiRoot) + "?access_token=" + token;
}

function expandTileURL(url, token) {
  var prefix = /^mapbox:\/\//;
  if ( !url.match(prefix) ) return url;
  var apiRoot = "https://api.mapbox.com/v4/";
  return url.replace(prefix, apiRoot) + ".json?secure&access_token=" + token;
}
