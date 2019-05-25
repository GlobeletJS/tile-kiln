import { loadStyle } from "./style.js";
import { initTileFactory } from "./tile.js";
import { initRenderer } from "./renderer.js";

export function init(canvSize, styleHref, callback) {
  // TODO: input object with defaults, and Mapbox API token
  var styleDoc, tileFactory, renderer;

  // Get the style info
  loadStyle(styleHref, setup);

  var api = { create };

  return api;

  function setup(err, preppedStyle) {
    if (err) callback(err);
    styleDoc = preppedStyle;
    tileFactory = initTileFactory(canvSize, styleDoc.sources);
    renderer = initRenderer(canvSize, styleDoc.layers);
    api.redraw = renderer.drawTile;
    return callback(null, api);
  }

  function create(z, x, y, cb) {
    var tile = tileFactory(z, x, y, render);
    function render(err) {
      if (err) cb(err);
      renderer.drawTile(tile, cb);
    }
    return;
  }
}
