'use strict';

import { initDisplay } from "./display.js";
import * as vectormap from "../../dist/vectormap.bundle.js";

//const styleHref = "https://api.mapbox.com/styles/v1/mapbox/streets-v8?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
//const styleHref = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
const styleHref = "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";

export function main() {
  // Initialize the display canvas and rendering context
  const dctx = initDisplay('map');

  // Initialize tile factory
  const tileMaker = vectormap.init(512, styleHref, getTile);

  function getTile(err, api) {
    if (err) return console.log(err);
    tileMaker.create(9, 120, 211, displayTile);
  }

  function displayTile(err, tile) {
    if (err) return console.log(err);

    // Copy the renderer canvas onto our display canvas
    dctx.drawImage(tile.img, 0, 0);
  }
}
