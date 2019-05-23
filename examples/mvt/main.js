'use strict';

import { initDisplay } from "./display.js";
import { readMVT, readJSON } from "./readVector.js";
import { prepStyle } from "./prepStyle.js";
import * as vectormap from "../../dist/vectormap.bundle.js";

//var tileHref = "data/terrain-v2_streets-v7_7-29-53.mvt";
//const tileHref = "https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/7/29/53.mvt?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
const baseURL = "https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/";
const tileName = "8/59/106.mvt";
const token = "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
const tileHref = baseURL + tileName + "?access_token=" + token;
//var styleHref = "data/streets-v8-style.json";
const styleHref = "https://api.mapbox.com/styles/v1/mapbox/streets-v8?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";

export function main() {
  // Initialize the display canvas and rendering context
  const dctx = initDisplay('map');

  // Initialize vector renderer, starting from an empty styleset
  const renderer = vectormap.init(512);

  // Get the style info
  readJSON(styleHref, (err, styles) => prepStyle(err, styles, loadTile) );

  function loadTile(err, preppedStyle) {
    if (err) return console.log(err);
    renderer.setStyles(preppedStyle.layers);
    readMVT(tileHref, 512, drawTile);
  }

  function drawTile(err, jsonData) {
    if (err) return console.log(err);

    var tile = {
      "sources": {
        "composite": jsonData,
      },
    }

    // Draw this tile to the renderer canvas
    var zoom = 8;
    renderer.drawTile(zoom, tile.sources);

    // Copy the renderer canvas onto our display canvas
    dctx.drawImage(renderer.canvas, 0, 0);
  }
}
