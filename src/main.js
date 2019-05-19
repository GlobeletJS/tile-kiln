import { derefLayers } from "./deref.js";
import * as d3 from 'd3-geo';
import { initFeatureGetter } from "./getFeatures.js";
import { evalStyle } from "./styleFunction.js";

export function init(ctx) {
  // Input ctx is a Canvas 2D rendering context
  // Save the default styling
  ctx.save();

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  const path = d3.geoPath(null, ctx);

  var styles, zoom;

  return {
    setStyles,
    drawMVT,
  };

  function setStyles(styleDoc) {
    // Input styleDoc is a Mapbox style document, following the specification at
    // https://docs.mapbox.com/mapbox-gl-js/style-spec/
    styles = styleDoc;
    styles.layers = derefLayers(styles.layers);
    return;
  }

  function drawMVT(tile, tileZoom, size, sx, sy) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var getFeatures = initFeatureGetter(size, sx, sy);
    zoom = tileZoom;

    for (let style of styles.layers) {
      // Quick exits if this layer is not meant to be displayed
      if (style.layout && style.layout["visibility"] === "none") continue;
      if (style.minzoom !== undefined && zoom < style.minzoom) continue;
      if (style.maxzoom !== undefined && zoom > style.maxzoom) continue;

      // Start from default styles
      ctx.restore();

      if (style.type === "background") { // Special handling: no data
        renderBackground(style);
        continue;
      }

      var mapLayer = findMapLayer(style["source-layer"], tile.layers);
      var mapData = getFeatures(mapLayer, style.filter);
      if (!mapData) continue;

      console.log("drawMVT: processing style id = " + style.id);

      switch (style.type) {
        case "circle" :  // Point or MultiPoint geometry
          renderCircle(style, mapData);
          break;
        case "line" :    // LineString, MultiLineString, Polygon, or MultiPolygon
          renderLine(style, mapData);
          break;
        case "fill" :    // Polygon or MultiPolygon (maybe also linestrings?)
          renderFill(style, mapData);
          break;
        case "symbol" :  // Labels
        default :
          console.log("ERROR in drawMVT: layer.type = " + style.type +
              " not supported!");
      }
    }
    return;
  }

  function renderBackground(style) {
    setStyle("fillStyle", style.paint["background-color"]);
    setStyle("globalAlpha", style.paint["background-opacity"]);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function renderCircle(style, data) {
    ctx.beginPath();
    var paint = style.paint;
    if (paint["circle-radius"]) path.pointRadius(paint["circle-radius"]);
    setStyle("fillStyle", paint["circle-color"]);
    setStyle("globalAlpha", paint["circle-opacity"]);
    // Missing circle-blur, circle-translate, circle-translate-anchor,
    //  and circle-stroke stuff
    path(data);
    ctx.fill();
  }

  function renderLine(style, data) {
    ctx.beginPath();
    setStyle("lineCap", style.layout["line-cap"]);
    setStyle("lineJoin", style.layout["line-join"]);
    setStyle("miterLimit", style.layout["line-miter-limit"]);
    // Missing line-round-limit
    setStyle("strokeStyle", style.paint["line-color"]);
    setStyle("lineWidth", style.paint["line-width"]);
    setStyle("globalAlpha", style.paint["line-opacity"]);
    // Missing line-gap-width, line-translate, line-translate-anchor,
    //  line-offset, line-blur, line-gradient, line-pattern, line-dasharray
    path(data);
    ctx.stroke();
  }

  function renderFill(style, data) {
    ctx.beginPath();
    setStyle("fillStyle", style.paint["fill-color"]);
    setStyle("globalAlpha", style.paint["fill-opacity"]);
    // Missing fill-outline-color, fill-translate, fill-translate-anchor,
    //  fill-pattern
    path(data);
    ctx.fill();
  }

  function setStyle(option, val) { // Nested for access to ctx, zoom
    // If val was not set, return without updating state
    // TODO: is this necessary? Canvas 2D already doesn't apply invalid values
    if (val === undefined) return;

    ctx[option] = (typeof val === "object")
      ? evalStyle(val, zoom)
      : val;
    return;
  }
}

function findMapLayer(name, layers) {
  if (!name) return false;
  for (let layer in layers) {
    if (layers[layer].name === name) return layers[layer];
  }
  return false; // No matching layer
}
