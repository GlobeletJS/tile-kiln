'use strict';

import { initDisplay } from "./display.js";
import * as tilekiln from "../../dist/tilekiln.bundle.js";

const tzxy = [7, 28, 52];

export function main() {
  // Initialize the display canvas and rendering context
  const dctx = initDisplay('map');

  // Initialize tile factory
  const tileMaker = tilekiln.init({
    size: 512,
    style: "mapbox://styles/mapbox/streets-v8",
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA", 
    callback: setup,
  });

  // Get a link to the tile coordinates printout
  var title = document.getElementById("zxy");
  var linesVisible = true;
  var hillshadeVisible = true;
  var currentTile;

  // Get first tile, setup interaction
  function setup(err, api) {
    if (err) return console.log(err);
    update();
    initHandlers();
  }

  function update() {
    currentTile = tileMaker.create(tzxy[0], tzxy[1], tzxy[2], displayTile);
  }
  function displayTile(err, tile) {
    if (err) return console.log(err);
    // Copy the renderer canvas onto our display canvas
    dctx.drawImage(tile.img, 0, 0);
    title.innerHTML = "z/x/y = " + tzxy[0] + "/" + tzxy[1] + "/" + tzxy[2];
  }

  function toggleLines() {
    linesVisible = !linesVisible;
    var visText = (linesVisible)
      ? "visible"
      : "none";

    tileMaker.style.layers.forEach(setLineVisibility);

    tileMaker.redraw(currentTile, displayTile);

    function setLineVisibility(layer) {
      if (layer.type !== "line") return;
      layer.layout.visibility = visText;
    }
  }

  function toggleHillshade() {
    hillshadeVisible = !hillshadeVisible;
    var visText = (hillshadeVisible)
      ? "visible"
      : "none";

    tileMaker.style.layers.forEach(setHillshadeVisibility);

    tileMaker.redraw(currentTile, displayTile);

    function setHillshadeVisibility(layer) {
      if (layer["source-layer"] !== "hillshade") return;
      layer.layout.visibility = visText;
    }
  }

  function initHandlers() {
    const lineToggle = document.getElementById("toggleLines");
    lineToggle.addEventListener("click", toggleLines, false);

    const hillshadeToggle = document.getElementById("toggleHillshade");
    hillshadeToggle.addEventListener("click", toggleHillshade, false);

    const left = document.getElementById("left");
    const right = document.getElementById("right");
    const up = document.getElementById("up");
    const down = document.getElementById("down");
    const zoomIn = document.getElementById("zoomIn");
    const zoomOut = document.getElementById("zoomOut");

    left.addEventListener("click", function(click) {
      tzxy[1]--;
      update();
    }, false);
    right.addEventListener("click", function(click) {
      tzxy[1]++;
      update();
    }, false);
    up.addEventListener("click", function(click) {
      tzxy[2]--;
      update();
    }, false);
    down.addEventListener("click", function(click) {
      tzxy[2]++;
      update();
    }, false);
    zoomIn.addEventListener("click", function(click) {
      tzxy[0]++;
      tzxy[1] *= 2;
      tzxy[2] *= 2;
      update();
    }, false);
    zoomOut.addEventListener("click", function(click) {
      tzxy[0]--;
      tzxy[1] = Math.floor(tzxy[1] / 2);
      tzxy[2] = Math.floor(tzxy[2] / 2);
      update();
    }, false);
  }
}
