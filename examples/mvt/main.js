'use strict';

import { initDisplay } from "./display.js";
import * as tilekiln from "../../dist/tilekiln.bundle.js";

export function main() {
  // Initialize the display canvas and rendering context
  const dctx = initDisplay('map');

  // Initialize tile factory
  const tileMaker = tilekiln.init({
    size: 512, 
    style: "mapbox://styles/mapbox/satellite-streets-v9", 
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA", 
    callback: getTile,
  });

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
