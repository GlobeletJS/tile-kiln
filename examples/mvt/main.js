'use strict';

import * as tilekiln from "../../dist/tile-kiln.bundle.js";

export function main() {
  tilekiln.init({
    size: 512,
    style: "mapbox://styles/mapbox/satellite-streets-v9",
    //style: "mapbox://styles/jhembd/cjuon9k8c0c111fn1sdmb2hw0", // Ukiyo-e
    //style: "mapbox://styles/jhembd/cjvr9koqc0a1v1cp73byc4bhj", // Mineral
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA", 
  }).then(setup)
    .catch(console.log);
}

function setup(api) {
  // Initialize the display canvas and rendering context
  const canvas = document.getElementById("map");
  canvas.width = canvas.height = 512;
  const dctx = canvas.getContext("2d");

  api.create(5, 8, 12, displayTile);

  function displayTile(err, tile) {
    if (err) return console.log(err);
    dctx.drawImage(tile.img, 0, 0);
  }
}
