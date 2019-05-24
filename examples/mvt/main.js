'use strict';

import { initDisplay } from "./display.js";
import { loadStyle } from "./style.js";
import { initTileFactory } from "./tile.js";
import * as vectormap from "../../dist/vectormap.bundle.js";

//const styleHref = "https://api.mapbox.com/styles/v1/mapbox/streets-v8?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
//const styleHref = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
const styleHref = "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";

export function main() {
  // Initialize the display canvas and rendering context
  const dctx = initDisplay('map');

  // Initialize vector renderer, starting from an empty styleset
  const renderer = vectormap.init(512);

  // Get the style info
  loadStyle(styleHref, loadTile);

  function loadTile(err, preppedStyle) {
    if (err) return console.log(err);
    renderer.setStyles(preppedStyle.layers);
    const tileFactory = initTileFactory(512, preppedStyle.sources);
    tileFactory(9, 120, 211, drawTile);
  }

  function drawTile(err, tile) {
    if (err) return console.log(err);

    // Draw this tile to the renderer canvas
    renderer.drawTile(tile.z, tile.sources);

    // Copy the renderer canvas onto our display canvas
    dctx.drawImage(renderer.canvas, 0, 0);
  }
}
