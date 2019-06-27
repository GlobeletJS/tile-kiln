import { loadStyle } from "./style.js";
import { initTileFactory } from "./tile.js";
import { initRenderer } from "./rendering/renderer.js";

export function init(params) {
  // Process parameters, substituting defaults as needed
  var canvSize = params.size || 512;
  var styleURL = params.style;   // REQUIRED
  var mbToken  = params.token;   // May be undefined
  var callback = params.callback || ( () => undefined );

  // Declare some variables & methods that will be defined inside a callback
  var styleGroups, tileFactory, renderer;

  const api = { // Initialize properties, update when styles load
    style: {},    // WARNING: directly modifiable from calling program
    create: () => undefined,
    drawGroup: (group) => undefined,
    composite: () => undefined,
    redraw: () => undefined,
    groups: [],
    ready: false,
  };

  // Get the style info
  loadStyle(styleURL, mbToken, setup);

  return api;

  function setup(err, styleDoc) {
    if (err) callback(err);

    // Get layer group names from styleDoc
    styleGroups = styleDoc.layers
      .map( layer => layer["tilekiln-group"] || "none" )
      .filter(uniq);

    // Make sure the groups in order, not interleaved
    var groupCheck = styleGroups.sort().filter(uniq);
    if (styleGroups.length !== groupCheck.length) {
      err = "tilekiln setup: Input layer groups are not in order!";
      return callback(err);
    }
    
    function uniq(x, i, a) {
      return ( !i || x !== a[i-1] ); // x is not a repeat of the previous value
    }

    tileFactory = initTileFactory(canvSize, styleDoc.sources, styleGroups);
    renderer = initRenderer(canvSize, styleDoc.layers, styleGroups, styleDoc.sprite);

    // Update api
    api.style = styleDoc;
    api.create = create;
    api.drawGroup = renderer.drawGroup;
    api.composite = renderer.composite;
    api.redraw = drawAll;
    api.ready = true;
    api.groups = styleGroups;

    return callback(null, api);
  }

  function create(z, x, y, cb) {
    var tile = tileFactory(z, x, y, render);
    function render(err) {
      if (err) cb(err);
      drawAll(tile);
      return cb(null, tile);
    }
    return tile;
  }

  function drawAll(tile, callback = () => true) {
    styleGroups.forEach( group => renderer.drawGroup(tile, group) );
    renderer.composite(tile);
    callback(null, tile);
  }
}
