import { loadStyle } from "./style.js";
import { initTileFactory } from "./tile.js";
import { initRenderer } from "./renderer.js";

export function init(params) {
  // Process parameters, substituting defaults as needed
  var canvSize = params.size || 512;
  var styleURL = params.style;   // REQUIRED
  var mbToken  = params.token;   // May be undefined
  var callback = params.callback || ( () => undefined );

  var styleDoc, tileFactory, renderer;
  var ready = false;

  // Get the style info
  loadStyle(styleURL, mbToken, setup);

  var api = { create };

  return api;

  function setup(err, preppedStyle) {
    if (err) callback(err);
    styleDoc = preppedStyle;
    tileFactory = initTileFactory(canvSize, styleDoc.sources);
    renderer = initRenderer(canvSize, styleDoc.layers);
    api.redraw = renderer.drawTile;
    ready = true;
    return callback(null, api);
  }

  function create(z, x, y, cb) {
    if (!ready) return;
    var tile = tileFactory(z, x, y, render);
    function render(err) {
      if (err) cb(err);
      renderer.drawTile(tile, cb);
    }
    return tile;
  }
}
