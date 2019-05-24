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

  const renderer = initRenderer(ctx);

  var styleLayers;
  function setStyles(layers) {
    // Input layers is the .layers property of a Mapbox style document.
    // Specification: https://docs.mapbox.com/mapbox-gl-js/style-spec/
    styleLayers = layers;
  }

  return {
    setStyles,
    drawTile,
    canvas,
  };

  function drawTile(zoom, sources) {
    ctx.clearRect(0, 0, canvSize, canvSize);

    //console.time('drawMVT');
    styleLayers.forEach( style => drawLayer(style, zoom, sources) );
    //console.timeEnd('drawMVT');
    
    return;
  }

  function drawLayer(style, zoom, sources) {
    // Quick exits if this layer is not meant to be displayed
    if (style.layout && style.layout["visibility"] === "none") return;
    if (style.minzoom !== undefined && zoom < style.minzoom) return;
    if (style.maxzoom !== undefined && zoom > style.maxzoom) return;

    // Start from default canvas state: restore what we saved
    ctx.restore();
    // restore POPS the saved state off a stack. So if we want to restore again
    // later, we need to re-save what we just restored
    ctx.save();

    if (style.type === "background") {
      return renderer.fillBackground(style, zoom);
    } else if (style.type === "raster") {
      var image = sources[ style["source"] ];
      return renderer.drawRaster(style, zoom, image, canvSize);
    }
    var jsonLayers = sources[ style["source"] ];
    var mapLayer = jsonLayers[ style["source-layer"] ];
    var mapData = getFeatures(mapLayer, style.filter);
    if (!mapData) return;
    return renderer.drawJSON(style, zoom, mapData);
  }
}
