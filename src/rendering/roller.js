import { evalStyle } from "./styleFunction.js";

// Renders layers that cover the whole tile (like painting with a roller)
export function initRoller(ctx) {
  // Input ctx is a Canvas 2D rendering context
  const canvSize = ctx.canvas.width;

  return {
    fillBackground,
    drawRaster,
  };

  function fillBackground(style, zoom) {
    // Cover the tile with a bucket of paint
    ctx.fillStyle = evalStyle(style.paint["background-color"], zoom);
    ctx.globalAlpha = evalStyle(style.paint["background-opacity"], zoom);
    ctx.fillRect(0, 0, canvSize, canvSize);
  }

  function drawRaster(style, zoom, image) {
    // Cover the tile with a prettily patterned wallpaper
    var paint = style.paint;
    if (paint !== undefined) {
      ctx.globalAlpha = evalStyle(paint["raster-opacity"], zoom);
      // Missing raster-hue-rotate, raster-brightness-min/max,
      // raster-saturation, raster-contrast
    }
    // TODO: we are forcing one tile to cover the canvas!
    // In some cases (e.g. Mapbox Satellite Streets) the raster tiles may
    // be half the size of the vector canvas, so we need 4 of them...
    ctx.drawImage(image, 0, 0, canvSize, canvSize);
  }
}
