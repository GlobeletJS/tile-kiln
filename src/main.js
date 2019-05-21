import { derefLayers } from "./deref.js";
import { getFeatures } from "./getFeatures.js";
import { initRenderer } from "./renderer.js";

export function init(canvSize) {
  // Create canvas for rendering, set drawingbuffer size
  const canvas = document.createElement("canvas");
  canvas.width = canvSize;
  canvas.height = canvSize;
  // Initialize rendering context and save default styles
  const ctx = canvas.getContext("2d");
  ctx.save();

  const styles = {};
  const renderer = initRenderer(ctx);

  return {
    setStyles,
    drawMVT,
    canvas,
  };

  function setStyles(styleDoc) {
    // Input styleDoc is a Mapbox style document, following the specification at
    // https://docs.mapbox.com/mapbox-gl-js/style-spec/
    styles.layers = derefLayers(styleDoc.layers);
    return;
  }

  function drawMVT(tile, zoom, size) {
    // Input tile is a JSON object of the form 
    //   { layerName1: FeatureCollection1, layerName2: ... }
    // where FeatureCollection is a GeoJSON object
    ctx.clearRect(0, 0, canvSize, canvSize);

    //console.time('drawMVT');
    styles.layers.forEach( style => drawLayer(style, zoom, tile) );
    //console.timeEnd('drawMVT');
    
    return;
  }

  function drawLayer(style, zoom, jsonLayers) {
    // Quick exits if this layer is not meant to be displayed
    if (style.layout && style.layout["visibility"] === "none") return;
    if (style.minzoom !== undefined && zoom < style.minzoom) return;
    if (style.maxzoom !== undefined && zoom > style.maxzoom) return;

    // Start from default styles: restore what we saved
    ctx.restore();
    // restore POPS the saved state off a stack. So if we want to restore again
    // later, we need to re-save what we just restored
    ctx.save();

    // If this is the background layer, we don't need any data
    if (style.type === "background") return renderer.fillBackground(style, zoom);

    var mapLayer = jsonLayers[ style["source-layer"] ];
    var mapData = getFeatures(mapLayer, style.filter);
    if (!mapData) return;

    return renderer.drawData(style, zoom, mapData);
  }
}
