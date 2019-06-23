import { readJSON, loadImage } from "./read.js";
import { derefLayers } from "./deref.js";

export function loadStyle(style, mapboxToken, callback) {
  if (typeof style === "object") {
    // style appears to be parsed JSON already. Prepare it for use
    return prepStyle(null, style, mapboxToken, callback);
  }
  // Style appears to be a URL string. Load the document, then prepare it
  var url = expandStyleURL(style, mapboxToken);
  var process = (err, doc) => prepStyle(err, doc, mapboxToken, callback);
  return readJSON(url, process);
}

export function prepStyle(err, styleDoc, token, callback) {
  if (err) return callback(err);
  styleDoc.layers = derefLayers(styleDoc.layers);

  // Prepare the "sources" object
  var sKeys = Object.keys(styleDoc.sources);
  var numToDo = sKeys.length;

  // Add "sprite" object if needed
  if (styleDoc.sprite) {
    numToDo += 2;
    var spriteURLs = expandSpriteURLs(styleDoc.sprite, token);
    // We will replace the .sprite URL with an object containing
    // image and metadata
    styleDoc.sprite = {};
    // Retrieve both .json and .png files
    loadImage(spriteURLs.image, prepSpriteImage);
    readJSON(spriteURLs.meta, prepSpriteMeta);
  }

  sKeys.forEach( key => prepSource(styleDoc.sources, key, token, finishAll) );
    
  function prepSpriteImage(err, png) {
    if (err) finishAll(err);
    styleDoc.sprite.image = png;
    finishAll(null);
  }

  function prepSpriteMeta(err, json) {
    if (err) finishAll(err);
    styleDoc.sprite.meta = json;
    finishAll(null);
  }

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

function expandSpriteURLs(url, token) {
  // Returns an array containing urls to .png and .json files
  var prefix = /^mapbox:\/\/sprites\//;
  if ( !url.match(prefix) ) return {
    image: url + ".png", 
    meta: url + ".json",
  };

  // We have a Mapbox custom url. Expand to an absolute URL, as per the spec
  var apiRoot = "https://api.mapbox.com/styles/v1/";
  url = url.replace(prefix, apiRoot) + "/sprite";
  var tokenString = "?access_token=" + token;
  return {
    image: url + ".png" + tokenString, 
    meta: url + ".json" + tokenString,
  };
}

function expandTileURL(url, token) {
  var prefix = /^mapbox:\/\//;
  if ( !url.match(prefix) ) return url;
  var apiRoot = "https://api.mapbox.com/v4/";
  return url.replace(prefix, apiRoot) + ".json?secure&access_token=" + token;
}
