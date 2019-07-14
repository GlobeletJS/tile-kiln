'use strict';

import { initDisplay } from "./display.js";
import * as tilekiln from "../../dist/tilekiln.bundle.js";
import { initTouchy } from 'touchy';
import { findNearest } from "./findNearest.js";

const tzxy = [6, 16, 25]; // This tile takes 240-250ms with version #e5da070f...

export function main() {
  // Initialize the display canvas and rendering context
  const display = initDisplay('map');

  // Set up mouse tracking
  const cursor = initTouchy(display.element); 

  // Get a link to the tile coordinates printout
  var title = document.getElementById("zxy");
  var burwellVisible = true;
  var labelsVisible = true;
  var currentTile, nextTile;

  // Get a link to the feature info printout
  var info = document.getElementById("info");

  // Initialize tile factory
  const tileMaker = tilekiln.init({
    size: 512,
    style: "./data/macrostrat-grouped.json", //sandwich.json",
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA",
    callback: setup,
  });

  // Get first tile, setup interaction
  function setup(err, api) {
    if (err) return console.log(err);
    initHandlers();
    update();
    requestAnimationFrame(checkRender);
  }

  function checkRender(time) {
    if (currentTile) {
      // Find the well nearest the cursor
      var box = display.element.getBoundingClientRect();
      var x = cursor.x() - box.left;
      var y = cursor.y() - box.top;
//      var layers = currentTile.sources["wells"];
//      var data = layers["TWDB_Groundwater_v2"];
//      var feature = findNearest(x, y, 5, data.features);
      // Print to info div
//      info.innerHTML = "<pre>" + JSON.stringify(feature, null, 2) + "</pre>";

      // Select this feature in the highlighted-well style
//      var styles = tileMaker.style.layers;
//      var highlighter = styles.find(layer => layer.id === "highlighted-well");

//      if (feature && feature.properties) {
//        highlighter.filter[2] = feature.properties.title.toString();
//      }
      //tileMaker.redraw(currentTile);
//      tileMaker.drawGroup(currentTile, "highlight");
//      tileMaker.composite(currentTile);
      display.context.clearRect(0, 0, 512, 512);
      display.context.drawImage(currentTile.img, 0, 0);
    }

    requestAnimationFrame(checkRender);
  }

  function update() {
    var checkTime = true;
    nextTile = tileMaker.create(tzxy[0], tzxy[1], tzxy[2], displayTile, checkTime);
  }
  function displayTile(err, tile, time) {
    if (err) return console.log(err);
    currentTile = nextTile;
    // Copy the renderer canvas onto our display canvas
    //display.context.drawImage(tile.img, 0, 0); // Move to animation loop
    title.innerHTML = "z/x/y = " + tzxy[0] + "/" + tzxy[1] + "/" + tzxy[2];
    info.innerHTML = "Render time: " + Math.round(time) + "ms";
  }

  function toggleBurwell() {
    burwellVisible = !burwellVisible;
    if (burwellVisible) {
      tileMaker.showGroup("burwell");
    } else {
      tileMaker.hideGroup("burwell");
    }
    tileMaker.composite(currentTile);
  }

  function toggleLabels() {
    labelsVisible = !labelsVisible;
    if (labelsVisible) {
      tileMaker.showGroup("labels");
    } else {
      tileMaker.hideGroup("labels");
    }
    tileMaker.composite(currentTile);
  }

  function initHandlers() {
    const burwellToggle = document.getElementById("toggleBurwell");
    burwellToggle.addEventListener("click", toggleBurwell, false);

    const labelToggle = document.getElementById("toggleLabels");
    labelToggle.addEventListener("click", toggleLabels, false);

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
