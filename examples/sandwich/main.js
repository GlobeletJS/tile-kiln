'use strict';

import { initDisplay } from "./display.js";
import * as tilekiln from "../../dist/tile-kiln.bundle.js";
import { initTouch } from 'touch-sampler';
import { findNearest } from "./findNearest.js";

const tzxy = [7, 28, 52];

export function main() {
  // Initialize the display canvas and rendering context
  const display = initDisplay('map');

  // Set up mouse tracking
  const cursor = initTouch(display.element); 

  // Get a link to the tile coordinates printout
  var title = document.getElementById("zxy");
  var linesVisible = true;
  var hillshadeVisible = true;
  var currentTile, nextTile;

  // Get a link to the feature info printout
  var info = document.getElementById("info");

  // Initialize tile factory
  const tileMaker = tilekiln.init({
    size: 512,
    style: "./wells_style.json", //"mapbox://styles/mapbox/streets-v8",
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
      var layers = currentTile.sources["wells"];
      var data = layers["TWDB_Groundwater_v2"];
      var feature = findNearest(x, y, 5, data.features);
      // Print to info div
      info.innerHTML = "<pre>" + JSON.stringify(feature, null, 2) + "</pre>";

      // Select this feature in the highlighted-well style
      var styles = tileMaker.style.layers;
      var highlighter = styles.find(layer => layer.id === "highlighted-well");

      if (feature && feature.properties) {
        highlighter.filter[2] = feature.properties.title.toString();
      }
      //tileMaker.redraw(currentTile);
      invalidateGroup(currentTile, "highlight");
      if (!currentTile.rendering) tileMaker.redraw(currentTile);
      display.context.drawImage(currentTile.img, 0, 0);
    }

    requestAnimationFrame(checkRender);
  }

  function invalidateGroup(tile, group) {
    tile.laminae[group].rendered = false;
    tile.rendered = false;
  }

  function update() {
    nextTile = tileMaker.create(tzxy[0], tzxy[1], tzxy[2], displayTile);
  }
  function displayTile(err, tile) {
    if (err) return console.log(err);
    currentTile = nextTile;
    // Copy the renderer canvas onto our display canvas
    //display.context.drawImage(tile.img, 0, 0); // Move to animation loop
    title.innerHTML = "z/x/y = " + tzxy[0] + "/" + tzxy[1] + "/" + tzxy[2];
  }

  function initHandlers() {
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
