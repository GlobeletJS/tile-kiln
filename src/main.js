import { initDisplay } from "./display.js";
import * as d3 from 'd3-geo';
import { readMVT, readGeoJSON } from "./readVector.js";

export function init(div, dataHref, dataType) {
  // Input div is the ID of an HTML div where the map will be rendered
  // Input dataHref is the path to a file containing map data
  // Input dataType is a flag indicating the file format. Accepted values:
  //   "geojson" -- GeoJSON
  //   "mvt" -- Mapbox vector tile

  // Initialize the canvas and rendering context
  const ctx = initDisplay(div);

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  var path = d3.geoPath(null, ctx);

  // Get the data
  if (dataType === "geojson") {
    readGeoJSON(dataHref, drawJSON);
  } else if (dataType === "mvt") {
    readMVT(dataHref, drawMVT);
  } else {
    console.log("dataType " + dataType + " not supported");
    return;
  }

  function drawMVT(err, tile) {
    if (err) {
      console.log(err);
      return;
    }
    const layers = tile.layers;
    for (let layer in layers) {
      console.log("Decoding layer " + layers[layer].name);
      var data = layerToGeoJSON( layers[layer] );
      //console.log("layer converted to GeoJSON = " + JSON.stringify(data));
      draw(ctx, path, data);
    }
  }

  function layerToGeoJSON( layer ) {
    // Based on https://observablehq.com/@mbostock/d3-mapbox-vector-tiles
    if (!layer) return;
    const features = [];
    for (let i = 0; i < layer.length; ++i) {
      // We ignore the tile coordinates for now, and treat it as the 0,0,0 tile
      const feature = layer.feature(i).toGeoJSON(512);
      features.push(feature);
    }
    return {
      type: "FeatureCollection", 
      features: features,
    };
  }

  function drawJSON(err, data) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(data);
    draw(ctx, path, data);
  }
}

function draw(ctx, path, data) {
  // Set up the drawing path and parameters
  ctx.beginPath();
  path(data);
  // Fill the areas
  ctx.fillStyle = "#DDEEDD";
  ctx.fill();
  // Set some line parameters
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Draw the boundaries
  //ctx.strokeStyle = "#000000";
  //ctx.lineWidth = 3;
  //ctx.stroke();
  // Draw boundaries again, to put a white strip in the middle
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1;
  ctx.stroke();
}
