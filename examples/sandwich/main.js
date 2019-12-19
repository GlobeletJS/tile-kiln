'use strict';

import * as tilekiln from "../../dist/tile-kiln.bundle.js";
import { initMapControl } from "./map-control.js";
import { initTouch } from 'touch-sampler';
import { findNearest } from "./findNearest.js";

export function main() {
  tilekiln.init({
    size: 512,
    style: "./wells_style.json",
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA", 
  }).then(setup)
    .catch(console.log);
}

function setup(api) {
  // Initialize the display canvas and rendering context
  const canvas = document.getElementById("map");
  canvas.width = canvas.height = 512;
  const dctx = canvas.getContext("2d");

  // Store a link to the highlighted-well style
  const highlighter = api.style.layers
    .find(layer => layer.id === "highlighted-well");

  // Get a link to the tile coordinates printout
  var title = document.getElementById("zxy");
  const coords = { z: 6, x: 14, y: 26 };

  // Set up mouse tracking
  const cursor = initTouch(canvas);
  var selectedTitle = "5858901";

  // Get a link to the feature info printout
  var info = document.getElementById("info");

  // Setup map control, get first tile
  const update = () => api.create(coords.z, coords.x, coords.y, display);
  initMapControl(coords, update);
  var currentTile;
  function startAnimation(err, tile) {
    display(err, tile);
    requestAnimationFrame(checkRender);
  }
  api.create(coords.z, coords.x, coords.y, startAnimation);

  function checkRender(time) {
    // Find the well nearest the cursor
    var box = canvas.getBoundingClientRect();
    var x = cursor.x() - box.left;
    var y = cursor.y() - box.top;
    var layers = currentTile.sources["wells"];
    var data = layers["TWDB_Groundwater_v2"];
    var feature = findNearest(x, y, 5, data.features);
    // Print to info div
    info.innerHTML = "<pre>" + JSON.stringify(feature, null, 2) + "</pre>";

    // Select this feature in the highlighted-well style
    if (feature && feature.properties) setFilter(feature.properties.title);

    requestAnimationFrame(checkRender);
  }

  function setFilter(title) {
    let titleString = title.toString();
    if (titleString === selectedTitle) return;

    selectedTitle = titleString;
    // TODO: doesn't work with current setup. The filter is already wrapped
    // into the painter function, so we need to re-initialize the painter
    highlighter.filter = f => f.properties.title === selectedTitle;

    currentTile.laminae["highlight"].rendered = false;
    currentTile.rendered = false;
    api.redraw(currentTile, display);
  }

  function display(err, tile) {
    if (err) return console.log(err);
    currentTile = tile;
    dctx.clearRect(0, 0, 512, 512);
    dctx.drawImage(currentTile.img, 0, 0);
    title.innerHTML = "z/x/y = " + coords.z + "/" + coords.x + "/" + coords.y;
  }
}
