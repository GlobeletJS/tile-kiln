import * as d3 from 'd3-geo';
import { layerToGeoJSON } from "./getFeatures.js";

export function initRenderer(ctx) {
  // Input ctx is a Canvas 2D rendering context
  // Input styleDoc is a Mapbox style document, following the specification at
  // https://docs.mapbox.com/mapbox-gl-js/style-spec/

  // Save the default styling
  ctx.save();

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  const path = d3.geoPath(null, ctx);

  var styles;

  return {
    setStyles,
    drawMVT,
  };

  function setStyles(styleDoc) {
    styles = styleDoc;
    return;
  }

  function drawMVT(tile) {
    // Clear the canvas, and restore default styles
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    for (let styleLayer of styles.layers) {
      console.log("drawMVT: processing styleLayer id = " + styleLayer.id);
      var layout = styleLayer.layout;
      if (layout && layout["visibility"] === "none") continue;
      var mapLayer = findMapLayer(styleLayer["source-layer"], tile.layers);
      var mapData = layerToGeoJSON(mapLayer, styleLayer.filter);

      switch (styleLayer.type) {
        case "background" :
          renderBackground(styleLayer);
          break;
        case "circle" :  // Point or MultiPoint geometry
          renderCircle(styleLayer, mapData);
          break;
        case "line" :    // LineString, MultiLineString, Polygon, or MultiPolygon
          renderLine(styleLayer, mapData);
          break;
        case "fill" :    // Polygon or MultiPolygon (maybe also linestrings?)
          renderFill(styleLayer, mapData);
          break;
        case "symbol" :  // Labels
        default :
          console.log("ERROR in drawMVT: layer.type = " + styleLayer.type +
              " not supported!");
      }
    }
    return;
  }

  function renderBackground(style) {
    if (!style.paint["background-color"]) return;
    ctx.fillStyle = style.paint["background-color"];
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function renderCircle(style, data) {
    if (!data) return;
    ctx.beginPath();
    var paint = style.paint;
    if (paint["circle-radius"]) path.pointRadius(paint["circle-radius"]);
    if (paint["circle-color"]) ctx.fillStyle = paint["circle-color"];
    path(data);
    ctx.fill();
  }

  function renderLine(style, data) {
    if (!data) return;
    ctx.beginPath();
    var layout = style.layout;
    if (layout["line-cap"]) ctx.lineCap = layout["line-cap"];
    if (layout["line-join"]) ctx.lineJoin = layout["line-join"];
    if (layout["line-miter-limit"]) ctx.miterLimit = layout["line-miter-limit"];
    var paint = style.paint;
    if (paint["line-color"]) ctx.strokeStyle = paint["line-color"];
    if (paint["line-width"]) ctx.lineWidth = paint["line-width"];
    path(data);
    ctx.stroke();
  }

  function renderFill(style, data) {
    if (!data) return;
    ctx.beginPath();
    if (style.paint["fill-color"]) ctx.fillStyle = style.paint["fill-color"];
    path(data);
    ctx.fill();
  }
}

function findMapLayer(name, layers) {
  if (!name) return false;
  for (let layer in layers) {
    if (layers[layer].name === name) return layers[layer];
  }
  return false; // No matching layer
}
