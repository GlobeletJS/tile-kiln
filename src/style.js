import { getJSON, getImage } from "./read-promises.js";
import { derefLayers } from "./deref.js";
import { expandStyleURL, expandSpriteURLs, expandTileURL } from "./mapbox.js";

export function loadStyle(style, mapboxToken, callback) {
  const getStyleJson = (typeof style === "object")
    ? Promise.resolve(style)                // style is JSON already
    : getJSON( expandStyleURL(style, mapboxToken) ); // Get from URL

  return getStyleJson
    .then(json => {
      json.layers = derefLayers(json.layers);
      return json;
    })
    .then(expandedJson => prepStyle(expandedJson, mapboxToken))
    .then(preppedStyle => callback(null, preppedStyle))
    .catch(err => callback(err));
}

function prepStyle(styleDoc, token) {
  const expandSources = Object.keys(styleDoc.sources)
    .map(key => expandSource(key, styleDoc.sources, token));

  const getSprite = loadSprite(styleDoc, token);

  return Promise.all([...expandSources, getSprite])
    .then(() => styleDoc);
}

function loadSprite(styleDoc, token) {
  if (!styleDoc.sprite) return;

  const urls = expandSpriteURLs(styleDoc.sprite, token);

  return Promise.all([getImage(urls.image), getJSON(urls.meta)])
    .then(([image, meta]) => { styleDoc.spriteData = { image, meta }; });
}

function expandSource(key, sources, token) {
  var source = sources[key];
  if (source.url === undefined) return; // No change

  // Load the referenced TileJSON document
  return getJSON( expandTileURL(source.url, token) )
    .then(json => merge(json));

  function merge(json) {
    // Add any custom properties from the style document
    Object.keys(source).forEach( k2 => { json[k2] = source[k2]; } );
    // Replace current entry with the TileJSON data
    sources[key] = json;
  }
}
