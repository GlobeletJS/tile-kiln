'use strict';

import { initDisplay } from "./display.js";
import { readMVT, readJSON } from "./readVector.js";
import * as vectormap from "../../dist/vectormap.bundle.js";

//var tileHref = "data/terrain-v2_streets-v7_7-29-53.mvt";
const tileHref = "https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/7/29/53.mvt?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
//var styleHref = "data/streets-v8-style.json";
const styleHref = "https://api.mapbox.com/styles/v1/mapbox/streets-v8?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";

export function main() {
  // Initialize the display canvas and rendering context
  const dctx = initDisplay('map');

  // Initialize vector renderer
  const renderer = vectormap.init(dctx.canvas.width, dctx.canvas.height);

  // Get the style info
  readJSON(styleHref, setup);

  function setup(err, styleDoc) {
    if (err) return console.log(err);
    renderer.setStyles(styleDoc);

    // Read the tile data
    readMVT(tileHref, drawTile);
  }

  function drawTile(err, tile) {
    if (err) return console.log(err);

    // Draw this tile to the renderer canvas
    var zoom = 7;
    var size = 512;
    var sx = 0;
    var sy = 0;
    renderer.drawMVT(tile, zoom, size, sx, sy);

    // Copy the renderer canvas onto our display canvas
    dctx.drawImage(renderer.canvas, 0, 0);
  }
}
