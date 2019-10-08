'use strict';

import { initDisplay } from "./display.js";
import * as tilekiln from "../../dist/tile-kiln.bundle.js";
import style from "./data/satellite-streets-v9-pretty.json";

export function main() {
  // Initialize the display canvas and rendering context
  const dctx = initDisplay('map');

  // Initialize tile factory
  const tileMaker = tilekiln.init({
    size: 512,
    style: style,
    //style: "mapbox://styles/mapbox/satellite-streets-v9",
    //style: "mapbox://styles/jhembd/cjuon9k8c0c111fn1sdmb2hw0", // Ukiyo-e
    //style: "mapbox://styles/jhembd/cjvr9koqc0a1v1cp73byc4bhj", // Mineral
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA", 
    callback: getTile,
  });

  function getTile(err, api) {
    if (err) return console.log(err);
    tileMaker.create(5, 8, 12, displayTile);
  }

  function displayTile(err, tile) {
    if (err) return console.log(err);

    // Copy the renderer canvas onto our display canvas
    dctx.drawImage(tile.img, 0, 0);
  }
}
