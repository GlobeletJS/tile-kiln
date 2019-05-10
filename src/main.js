import { initDisplay } from "./display.js";
import * as d3 from 'd3-geo';
//import * as topojson from 'topojson-client';

export function init(div, data) {
  // Input div is the ID of an HTML div where the map will be rendered
  // Input data is a GeoJSON object

  // Initialize the canvas and rendering context
  const ctx = initDisplay(div);

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  var path = d3.geoPath(null, ctx);

  // Set up the drawing path and parameters
  ctx.beginPath();
  path(data);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;

  // Draw the data
  ctx.stroke();
}
