import { getFeatures } from "./getFeatures.js";
import { initPainter } from "./painter.js";

export function initRenderer(canvSize, styleLayers, sprite) {
  // Input styleLayers points to the .layers property of a Mapbox style document
  // Specification: https://docs.mapbox.com/mapbox-gl-js/style-spec/
  // Input sprite (if defined) is an object with image and meta properties

  // Create canvas for rendering, set drawingbuffer size
  const canvas = document.createElement("canvas");
  canvas.width = canvSize;
  canvas.height = canvSize;

  // Initialize rendering context and save default styles
  const ctx = canvas.getContext("2d");
  ctx.save();

  // Initialize painter: paints a single layer onto the canvas
  const painter = initPainter(ctx);

  return {
    drawTile,
    canvas,
  };

  function drawTile(tile, callback = () => undefined) {
    ctx.clearRect(0, 0, canvSize, canvSize);
    styleLayers.forEach( style => drawLayer(style, tile.z, tile.sources) );
    // Copy the rendered image to the tile
    //tile.img.onload = checkImg;
    //tile.img.src = canvas.toDataURL(); // Slow!! >50ms for canvSize = 512
    tile.ctx.drawImage(canvas, 0, 0); // 5-6ms. why not render to this ctx in the first place?
    checkImg();
    
    function checkImg() {
      tile.rendered = true;
      return callback(null, tile);
    }
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

    if (style.type === "background") return painter.fillBackground(style, zoom);

    var source = sources[ style["source"] ];
    if (style.type === "raster") return painter.drawRaster(style, zoom, source);

    var mapLayer = source[ style["source-layer"] ];
    var mapData = getFeatures(mapLayer, style.filter);
    if (!mapData) return;
    return painter.drawJSON(style, zoom, mapData, sprite);
  }
}
