import { loadStyle } from "./style.js";
import { initTileFactory } from "./tile.js";
import { initRenderer } from "./renderer.js";

export function init(params) {
  // Process parameters, substituting defaults as needed
  var canvSize = params.size || 512;
  var styleURL = params.style;   // REQUIRED
  var mbToken  = params.token;   // May be undefined
  var callback = params.callback || ( () => undefined );

  // Declare some global functions that will be defined inside a callback
  var tileFactory, renderer;

  // Get the style info  TODO: allow user to supply style object directly
  loadStyle(styleURL, mbToken, setup);

  const api = { // Initialize properties, update when styles load
    style: {},    // WARNING: directly modifiable from calling program
    create: () => undefined,
    redraw: () => undefined,
    ready: false,
  };

  return api;

  function setup(err, styleDoc) {
    if (err) callback(err);
    tileFactory = initTileFactory(canvSize, styleDoc.sources);
    renderer = initRenderer(canvSize, styleDoc.layers);

    // Update api
    api.style = styleDoc;
    api.create = create;
    api.redraw = renderer.drawTile;
    api.ready = true;

    return callback(null, api);
  }

  function create(z, x, y, cb) {
    var tile = tileFactory(z, x, y, render);
    function render(err) {
      if (err) cb(err);
      renderer.drawTile(tile, cb);
    }
    return tile;
  }
}
