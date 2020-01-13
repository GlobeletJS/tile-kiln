'use strict';

import * as tilekiln from "../../dist/tile-kiln.bundle.js";
import { initMapControl } from "./map-control.js";

export function main() {
  tilekiln.init({
    size: 512,
    style: "mapbox://styles/mapbox/streets-v8",
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA", 
  }).promise.then(setup)
    .catch(console.log);
}

function setup(tkapi) {
  // Initialize the display canvas and rendering context
  const canvas = document.getElementById("map");
  canvas.width = canvas.height = 512;
  const dctx = canvas.getContext("2d");

  // Get a link to the tile coordinates printout
  var title = document.getElementById("zxy");
  const coords = { z: 6, x: 14, y: 26 };

  // Get first tile, setup map position control
  var currentTile = tkapi.create(coords.z, coords.x, coords.y, display);
  initMapControl(coords, update);

  // Set up toggle for hillshade visibility
  var hillshadeVisible = true;
  const hillshadeLayers = tkapi.style.layers
    .filter(layer => layer["source-layer"] === "hillshade")
    .map(layer => layer.id);
  document.getElementById("toggleLines")
    .addEventListener("click", () => {
      linesVisible = !linesVisible;
      setVisibility(linesLayers, linesVisible);
    }, false);

  // Set up toggle for lines visibility
  var linesVisible = true;
  const linesLayers = tkapi.style.layers
    .filter(layer => layer.type === "line")
    .map(layer => layer.id);
  document.getElementById("toggleHillshade")
    .addEventListener("click", () => {
      hillshadeVisible = !hillshadeVisible;
      setVisibility(hillshadeLayers, hillshadeVisible);
    }, false);

  // Define misc functions
  function update() {
    currentTile = tkapi.create(coords.z, coords.x, coords.y, display);
  }

  function display(err, tile) {
    if (err) return console.log(err);
    dctx.drawImage(tile.img, 0, 0);
    title.innerHTML = "z/x/y = " + coords.z + "/" + coords.x + "/" + coords.y;
  }

  function setVisibility(layers, visibility) {
    if (visibility) {
      layers.forEach(layer => tkapi.showLayer(layer));
    } else {
      layers.forEach(layer => tkapi.hideLayer(layer));
    }
    currentTile.rendered = false;
    tkapi.redraw(currentTile, display);
  }
}
