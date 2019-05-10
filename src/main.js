import { initDisplay } from "./display.js";
import * as d3 from 'd3-geo';
//import * as topojson from 'topojson-client';

export function init(div, dataHref) {
  // Input div is the ID of an HTML div where the map will be rendered
  // Input dataHref is the path to a file containing GeoJSON

  // Initialize the canvas and rendering context
  const ctx = initDisplay(div);

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  var path = d3.geoPath(null, ctx);

  // Get the data
  var request = new XMLHttpRequest();
  request.onload = drawData;
  request.onerror = requestError;
  request.open('get', dataHref);
  request.send();

  function drawData() {
    var data = JSON.parse(this.responseText);
    draw(ctx, path, data);
  }
}

function draw(ctx, path, data) {
  // Set up the drawing path and parameters
  ctx.beginPath();
  path(data);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;

  // Draw the data
  ctx.stroke();
}

function requestError(err) {
  console.log("XMLHttpRequest Error: " + err);
}
