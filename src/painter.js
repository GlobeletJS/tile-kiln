import * as d3 from 'd3-geo';
import { evalStyle } from "./styleFunction.js";
import { renderSymbols } from "./symbols.js";

export function initPainter(ctx) {
  // Input ctx is a Canvas 2D rendering context
  const canvSize = ctx.canvas.width;

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  const path = d3.geoPath(null, ctx);

  return {
    fillBackground,
    drawRaster,
    drawJSON,
  };

  function fillBackground(style, zoom) {
    setStyle("fillStyle", style.paint["background-color"], zoom);
    setStyle("globalAlpha", style.paint["background-opacity"], zoom);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function drawRaster(style, zoom, image) {
    var paint = style.paint;
    if (paint !== undefined) {
      setStyle("globalAlpha", paint["raster-opacity"], zoom);
      // Missing raster-hue-rotate, raster-brightness-min/max,
      // raster-saturation, raster-contrast
    }
    // TODO: we are forcing one tile to cover the canvas!
    // In some cases (e.g. Mapbox Satellite Streets) the raster tiles may
    // be half the size of the vector canvas, so we need 4 of them...
    ctx.drawImage(image, 0, 0, canvSize, canvSize);
    return;
  }

  function drawJSON(style, zoom, mapData, sprite) {
    // Input style is ONE layer from a Mapbox style document
    // Input mapData is a GeoJSON "FeatureCollection" 

    switch (style.type) {
      case "circle":  // Point or MultiPoint geometry
        renderCircle(style, zoom, mapData);
        break;
      case "line":    // LineString, MultiLineString, Polygon, or MultiPolygon
        renderLine(style, zoom, mapData);
        break;
      case "fill":    // Polygon or MultiPolygon (maybe also linestrings?)
        renderFill(style, zoom, mapData);
        break;
      case "symbol":  // Labels
        renderSymbols(ctx, style, zoom, mapData, sprite);
        break;
      default :
        //console.log("ERROR in drawMVT: layer.type = " + style.type +
        //    " not supported!");
    }
    return;
  }

  function renderCircle(style, zoom, data) {
    ctx.beginPath();
    var paint = style.paint;
    if (paint["circle-radius"]) {
      var radius = evalStyle(paint["circle-radius"], zoom);
      path.pointRadius(radius);
    }
    setStyle("fillStyle", paint["circle-color"], zoom);
    setStyle("globalAlpha", paint["circle-opacity"], zoom);
    // Missing circle-blur, circle-translate, circle-translate-anchor,
    //  and circle-stroke stuff
    path(data);
    ctx.fill();
  }

  function renderLine(style, zoom, data) {
    ctx.beginPath();
    setStyle("lineCap", style.layout["line-cap"], zoom);
    setStyle("lineJoin", style.layout["line-join"], zoom);
    setStyle("miterLimit", style.layout["line-miter-limit"], zoom);
    // Missing line-round-limit
    setStyle("strokeStyle", style.paint["line-color"], zoom);
    setStyle("lineWidth", style.paint["line-width"], zoom);
    setStyle("globalAlpha", style.paint["line-opacity"], zoom);
    // Missing line-gap-width, line-translate, line-translate-anchor,
    //  line-offset, line-blur, line-gradient, line-pattern, line-dasharray
    path(data);
    ctx.stroke();
  }

  function renderFill(style, zoom, data) {
    ctx.beginPath();
    setStyle("fillStyle", style.paint["fill-color"], zoom);
    setStyle("globalAlpha", style.paint["fill-opacity"], zoom);
    // Missing fill-outline-color, fill-translate, fill-translate-anchor,
    //  fill-pattern
    path(data);
    ctx.fill();
  }

  function setStyle(option, val, zoom) { // Nested for access to ctx
    var calcVal = evalStyle(val, zoom);
    // If val was not set, return without updating state
    // TODO: is this necessary? Canvas 2D already doesn't apply undefined values
    if (calcVal === undefined) return;

    ctx[option] = calcVal;
    return;
  }
}
