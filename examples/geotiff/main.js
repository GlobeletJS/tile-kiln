'use strict';

import * as tilekiln from "../../dist/tile-kiln.bundle.js";
import { initMapControl } from "./map-control.js";
import * as d3 from "d3";

export function main() {
  tilekiln.init({
    size: 512,
    style: "./soilgrids.json",
    token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA",
  }).then(setup)
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

  // Get a link to the feature info printout
  var info = document.getElementById("info");

  // Get first tile, setup interaction
  var currentTile = api.create(coords.z, coords.x, coords.y, display, true);
  initMapControl(coords, update);

  // Set up toggle for burwell polygons
  var burwellVisible = true;
  document.getElementById("toggleBurwell")
    .addEventListener("click", () => {
      burwellVisible = !burwellVisible;
      setVisibility("burwell", burwellVisible);
    }, false);

  // Set up toggle for labels
  var labelsVisible = true;
  document.getElementById("toggleLabels")
    .addEventListener("click", () => {
      labelsVisible = !labelsVisible;
      setVisibility("labels", labelsVisible);
    }, false);

  // Define misc functions
  function update() {
    currentTile = api.create(coords.z, coords.x, coords.y, display, true);
  }

  function display(err, tile, time) {
    if (err) return console.log(err);
    // Copy the renderer canvas onto our display canvas
    console.log("Display");
    //console.log("Tile Data: "+tile.sources[bedrock][12]);
    //console.log("Tile Data Length: "+tile.sources[bedrock].length);
    var t2, t3, t4;
    t2=performance.now();
    var tileScale= d3.scaleLinear();
    tileScale
      .domain([Math.log(100), Math.log(30000)])
      .range([0, 1]);
    var tileColor=[];
    var bedrock = tile.sources.bedrock;
    var loop1=tile.sources.bedrock.length;
    for (var i=0; i<loop1; i++) {
      tileColor[i]=d3.rgb(d3.interpolateYlGnBu(tileScale(Math.log(bedrock[i]))));     //This takes 3.5s(l1)+0.5s(l2). Moving d3.rgb to loop2 takes 3s(l1) + 3s(l2)
    }
    t3=performance.now();
    const imageData=dctx.createImageData(512,512);
    var k=0;
    var loop2=imageData.data.length;
    for (let i = 0; i < loop2; i += 4) {
      k=i/4;
      // Modify pixel data.
      imageData.data[i + 0] = (tileColor[k]).r;  // R value     //This takes 0.5s 
      imageData.data[i + 1] = (tileColor[k]).g;    // G value
      imageData.data[i + 2] = (tileColor[k]).b;  // B value
      //igeData.data[i + 0] = (d3.rgb(d3.interpolateYlGnBu(tileScale(Math.log(bedrock[k]))))).r;  // R value //this takes 10s (l2 only, l1 not needed)
      //imageData.data[i + 1] = (d3.rgb(d3.interpolateYlGnBu(tileScale(Math.log(bedrock[k]))))).g;    // G value
      //imageData.data[i + 2] = (d3.rgb(d3.interpolateYlGnBu(tileScale(Math.log(bedrock[k]))))).b;  // B value
      imageData.data[i + 3] = 255;  // A value
    }
    dctx.putImageData(imageData,0,0);
    t4=performance.now();
    let timeColors = (t3 - t2).toFixed(3) + "ms";
    let timePaint = (t4 - t3).toFixed(3) + "ms";
    console.log("compute colors: time = " + timeColors);
    console.log("paint canvas: time = " + timePaint);

    title.innerHTML = "z/x/y = " + coords.z + "/" + coords.x + "/" + coords.y;
    info.innerHTML = "Render time: " + Math.round(time) + "ms";
  }

  function setVisibility(group, visibility) {
    if (visibility) {
      api.showGroup(group);
    } else {
      api.hideGroup(group);
    }
    currentTile.rendered = false;
    api.redraw(currentTile, display);
  }
}
