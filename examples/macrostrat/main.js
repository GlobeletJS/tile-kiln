'use strict';

import * as tilekiln from "../../dist/tile-kiln.bundle.js";
import { initMapControl } from "./map-control.js";

export function main() {
  tilekiln.init({
    size: 512,
    style: "./macrostrat-onepass.json",
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
  const coords = { z: 6, x: 16, y: 25 };

  // Get a link to the feature info printout
  var info = document.getElementById("info");

  // Get first tile, setup interaction
  var currentTile = api.create(coords.z, coords.x, coords.y, display, true);
  initMapControl(coords, update);

  // Set up toggle for burwell polygons
  var burwellVisible = true;
  const burwellLayers = api.style.layers
    .filter(l => l["tilekiln-group"] === "burwell")
    .map(l => l.id);
  document.getElementById("toggleBurwell")
    .addEventListener("click", () => {
      burwellVisible = !burwellVisible;
      setVisibility(burwellLayers, burwellVisible);
    }, false);

  // Set up toggle for labels
  var labelsVisible = true;
  const labelLayers = api.style.layers
    .filter(l => l["tilekiln-group"] === "labels")
    .map(l => l.id);
  document.getElementById("toggleLabels")
    .addEventListener("click", () => {
      labelsVisible = !labelsVisible;
      setVisibility(labelLayers, labelsVisible);
    }, false);

  // Define misc functions
  function update() {
    currentTile = api.create(coords.z, coords.x, coords.y, display, true);
  }

  function display(err, tile, renderTime, loadTime) {
    if (err) return console.log(err);
    // Copy the renderer canvas onto our display canvas
    dctx.drawImage(tile.img, 0, 0);
    title.innerHTML = "z/x/y = " + coords.z + "/" + coords.x + "/" + coords.y;
    if (loadTime) info.innerHTML = "Load time: " + loadTime.toFixed(3) + "ms";
    if (renderTime) info.innerHTML += "<br>Render time: " + renderTime.toFixed(3) + "ms";
  }

  function setVisibility(layers, visibility) {
    if (visibility) {
      layers.forEach(layer => api.showLayer(layer));
    } else {
      layers.forEach(layer => api.hideLayer(layer));
    }
    currentTile.rendered = false;
    api.redraw(currentTile, display);
  }
}
