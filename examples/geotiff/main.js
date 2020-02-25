'use strict';

import * as tilekiln from "../../dist/tile-kiln.bundle.js";
import { initMapControl } from "./map-control.js";

export function main() {
  tilekiln.init({
    size: 512,
    style: "./geotiff-style.json",
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA", 
  }).promise.then(setup)
    .catch(console.log);
}

function setup(api) {
  // Initialize the display canvas and rendering context
  const canvas = document.getElementById("map");
  canvas.width = canvas.height = 512;
  const dctx = canvas.getContext("2d");
  // Get a link to the tile coordinates printout
  var title = document.getElementById("zxy");
  const coords = { z: 5, x: 6, y: 12 };

  // Get first tile, setup map position control
  var currentTile = api.create(coords.z, coords.x, coords.y, displayTile);
  initMapControl(coords, update);
  //api.create(5, 6, 12, displayTile);

  function displayTile(err, tile) {
    if (err) return console.log(err);
    dctx.drawImage(tile.img, tile.xIndex, tile.yIndex, tile.cropSize, tile.cropSize, 0, 0, 512, 512);
  }
  
  // Define misc functions
  function update() {
    currentTile = api.create(coords.z, coords.x, coords.y, displayTile);
  }
}
