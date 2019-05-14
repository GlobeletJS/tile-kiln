import { initDisplay } from "./display.js";
import * as d3 from 'd3-geo';
import { readMVT, readJSON } from "./readVector.js";

export function init(div, dataHref, styleHref, dataType) {
  // Input div is the ID of an HTML div where the map will be rendered
  // Input dataHref is the path to a file containing map data
  // Input dataType is a flag indicating the file format. Accepted values:
  //   "geojson" -- GeoJSON
  //   "mvt" -- Mapbox vector tile

  // Initialize the canvas and rendering context
  const ctx = initDisplay(div);
  // Save the default styling
  ctx.save();

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  var path = d3.geoPath(null, ctx);

  // Get the style info
  const layerStyles = {};
  readJSON(styleHref, sortStyles);

  function sortStyles(err, styleObj) {
    if (err) {
      console.log(err);
      return;
    }
    // Index each layer's style by the layer name for easier access
    for (let layer of styleObj.layers) {
      layerStyles[ layer["source-layer"] ] = layer;
      console.log("Styles for layer " + layer["source-layer"] + ":");
      console.log(layer);
    }
    readMap();
  }

  function readMap() {
    // Get the map data
    if (dataType === "geojson") {
      readJSON(dataHref, drawJSON);
    } else if (dataType === "mvt") {
      readMVT(dataHref, drawMVT);
    } else {
      console.log("dataType " + dataType + " not supported");
    }
  }

  function drawMVT(err, tile) {
    if (err) {
      console.log(err);
      return;
    }
    const layers = tile.layers;
    for (let layer in layers) {
      // Convert this layer to GeoJSON
      console.log("Decoding layer " + layers[layer].name);
      var data = layerToGeoJSON( layers[layer] );
      //console.log("layer converted to GeoJSON = " + JSON.stringify(data));

      // Draw this layer, using the associated styles
      draw(ctx, path, data, layerStyles[ layers[layer].name ]);
    }
  }

  function layerToGeoJSON( layer ) {
    // Based on https://observablehq.com/@mbostock/d3-mapbox-vector-tiles
    if (!layer) return;
    const features = [];
    for (let i = 0; i < layer.length; ++i) {
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

function draw(ctx, path, data, style) {
  console.log("In draw function. style:");
  console.log(style);

  // Reset context to default styles
  ctx.restore();
  // Set up the drawing path
  ctx.beginPath();

  // Apply styling
  let layout = style.layout;
  let paint  = style.paint;
  switch (style.type) {
    case "circle" :  // Point or MultiPoint geometry
      if (paint["circle-radius"]) path.pointRadius(paint["circle-radius"]);
      if (paint["circle-color"]) ctx.fillStyle = paint["circle-color"];
      path(data);
      ctx.fill();
      break;
    case "line" :    // LineString, MultiLineString, Polygon, or MultiPolygon
      if (layout["line-cap"]) ctx.lineCap = layout["line-cap"];
      if (layout["line-join"]) ctx.lineJoin = layout["line-join"];
      if (layout["line-miter-limit"]) ctx.miterLimit = layout["line-miter-limit"];
      if (paint["line-color"]) ctx.strokeStyle = paint["line-color"];
      if (paint["line-width"]) ctx.lineWidth = paint["line-width"];
      path(data);
      ctx.stroke();
      break;
    case "fill" :    // Polygon or MultiPolygon (maybe also linestrings?)
      if (paint["fill-color"]) ctx.fillStyle = paint["fill-color"];
      path(data);
      ctx.fill();
      break;
    default:
      console.log("ERROR: Unknown layer rendering type: " + style.type);
  }
  return;
}
