'use strict';

import { initDisplay } from "./display.js";
import * as tilekiln from "../../dist/tile-kiln.bundle.js";
import { findNearest } from "./findNearest.js";

const tzxy = [6, 16, 25]; // This tile takes 240-250ms with version #e5da070f...

export function main() {
  // Initialize the display canvas and rendering context
  const display = initDisplay('map');

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
    style: "./macrostrat-grouped.json",
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA",
    callback: setup,
  });

  // Declare time tracking variables
  var clickTime, displayTime, dt, requestActive;
  var framesSinceRedraw = 999;

  // Get first tile, setup interaction
  function setup(err, api) {
    if (err) return console.log(err);
    initHandlers();
    update();
    requestAnimationFrame(checkRender);
  }

  function checkRender(time) {
    if (currentTile) {
      display.context.clearRect(0, 0, 512, 512);
      display.context.drawImage(currentTile.img, 0, 0);
    }
    if (requestActive) {
      dt = (time - clickTime).toFixed(1);
      info.innerHTML += "<br>Animation frame: " + dt + "ms";
    } else if (framesSinceRedraw < 3) {
      dt = (time - clickTime).toFixed(1);
      info.innerHTML += "<br>Animation frame: " + dt + "ms";
      framesSinceRedraw++;
    }

    requestAnimationFrame(checkRender);
  }

  function update() {
    // Clear printout, start timer
    info.innerHTML = "";
    clickTime = performance.now();
    requestActive = true;
    var checkTime = true;
    nextTile = tileMaker.create(tzxy[0], tzxy[1], tzxy[2], displayTile, checkTime);
  }
  function displayTile(err, tile, renderTime, prepTime) {
    if (err) {
      info.innerHTML += "<br>" + err;
      return;
      //return console.log(err);
    }
    currentTile = nextTile;
    // Copy the renderer canvas onto our display canvas
    //display.context.drawImage(tile.img, 0, 0); // Move to animation loop
    title.innerHTML = "z/x/y = " + tzxy[0] + "/" + tzxy[1] + "/" + tzxy[2];
    info.innerHTML += "<br>Prep time: " + Math.round(prepTime) + "ms";
    info.innerHTML += "<br>Render time: " + Math.round(renderTime) + "ms";
    displayTime = Math.round(performance.now() - clickTime);
    info.innerHTML += "<br>Total delay: " + displayTime + "ms";
    requestActive = false;
    framesSinceRedraw = 0;
  }

  function toggleBurwell() {
    burwellVisible = !burwellVisible;
    if (burwellVisible) {
      tileMaker.showGroup("burwell");
    } else {
      tileMaker.hideGroup("burwell");
    }
    currentTile.rendered = false;
    clickTime = performance.now();
    requestActive = true;
    tileMaker.redraw(currentTile, displayTile, true);
  }

  function toggleLabels() {
    labelsVisible = !labelsVisible;
    if (labelsVisible) {
      tileMaker.showGroup("labels");
    } else {
      tileMaker.hideGroup("labels");
    }
    currentTile.rendered = false;
    clickTime = performance.now();
    requestActive = true;
    tileMaker.redraw(currentTile, displayTile, true);
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
