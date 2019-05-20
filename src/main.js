import { derefLayers } from "./deref.js";
import { initFeatureGetter } from "./getFeatures.js";
import { initRenderer } from "./renderer.js";

export function init(ctx) {
  // Input ctx is a Canvas 2D rendering context
  // Save the default styling
  ctx.save();

  const styles = {};
  const renderer = initRenderer(ctx);

  return {
    setStyles,
    drawMVT,
  };

  function setStyles(styleDoc) {
    // Input styleDoc is a Mapbox style document, following the specification at
    // https://docs.mapbox.com/mapbox-gl-js/style-spec/
    styles.layers = derefLayers(styleDoc.layers);
    return;
  }

  function drawMVT(tile, zoom, size, sx, sy) {
    // Input tile is a Mapbox Vector Tile, already parsed by 'vector-tile-js'
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var getFeatures = initFeatureGetter(size, sx, sy);
    styles.layers.forEach( style => drawLayer(style, zoom, tile, getFeatures) );
    return;
  }

  function drawLayer(style, zoom, tile, getFeatures) {
    // Quick exits if this layer is not meant to be displayed
    if (style.layout && style.layout["visibility"] === "none") return;
    if (style.minzoom !== undefined && zoom < style.minzoom) return;
    if (style.maxzoom !== undefined && zoom > style.maxzoom) return;

    // Start from default styles
    ctx.restore();

    // If this is the background layer, we don't need any data
    if (style.type === "background") return renderer.fillBackground(style, zoom);

    var mapLayer = findMapLayer(style["source-layer"], tile.layers);
    var mapData = getFeatures(mapLayer, style.filter);
    if (!mapData) return;

    return renderer.drawData(style, zoom, mapData);
  }
}

function findMapLayer(name, layers) {
  if (name === undefined) return false;
  return Object.values(layers).find(layer => layer.name === name);
}
