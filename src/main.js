import { initDisplay } from "./display.js";
import { initRenderer } from "./renderer.js";
import { readMVT, readJSON } from "./readVector.js";

export function init(div, tileHref, styleHref) {
  // Input div is the ID of an HTML div where the map will be rendered
  // Input tileHref is the path to a Mapbox vector tile

  // Initialize the canvas and rendering context
  const ctx = initDisplay(div);

  // Initialize the renderer
  const renderer = initRenderer(ctx);

  // Get the style info
  const layerStyles = {};
  readJSON(styleHref, setup);

  function setup(err, styleDoc) {
    if (err) {
      console.log(err);
      return;
    }
    renderer.setStyles(styleDoc);

    // Read the tile data
    readMVT(tileHref, drawMVT);
  }

  // Draw the tile
  function drawMVT(err, tile) {
    if (err) {
      console.log(err);
      return;
    }
    // TODO: get these from calling prog.
    var zoom = 7;
    var size = 512;
    var sx = 0;
    var sy = 0;
    renderer.drawMVT(tile, zoom, size, sx, sy);
  }
}
