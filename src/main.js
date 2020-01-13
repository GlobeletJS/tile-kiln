import { loadStyle, getStyleFuncs } from 'tile-stencil';
import { initPainter } from 'tile-painter';
import { initTileFactory } from "./tile.js";

export function init(params) {
  // Process parameters, substituting defaults as needed
  var canvSize = params.size || 512;
  var styleURL = params.style;   // REQUIRED
  var mbToken  = params.token;   // May be undefined
  var nThreads = params.threads || 4;

  // Create dummy API for instant return
  const api = {
    create: () => null,
    redraw: () => null,
    hideLayer: () => null,
    showLayer: () => null,
    sortTasks: () => null,
  };

  // Load the style, and then set everything up
  api.promise = loadStyle(styleURL, mbToken)
    .then( styleDoc => setup(styleDoc, canvSize, nThreads, api) );

  return api;
}

function setup(styleDoc, canvSize, nThreads, api) {
  const tileFactory = initTileFactory(styleDoc, canvSize, nThreads);
  const spriteObject = styleDoc.spriteData;

  // Reverse the order of the symbol layers, for correct collision checking
  const labels = styleDoc.layers
    .filter(l => l.type === "symbol");
  const layers = styleDoc.layers
    .filter( l => l.type !== "symbol" )
    .concat( labels.reverse() )
    .map( getStyleFuncs )
    .map( makeLayerFunc );

  function makeLayerFunc(styleLayer) {
    const paint = initPainter({ styleLayer, spriteObject, canvSize });
    return { paint, id: styleLayer.id, visible: true };
  }

  function setLayerVisibility(id, visibility) {
    var layer = layers.find(l => l.id === id);
    if (layer) layer.visible = visibility;
  }

  function render(tile, callback = () => true) {
    if (tile.canceled || !tile.loaded || tile.rendered) return;
    const bboxes = [];
    layers.forEach(layer => {
      if (!layer.visible) return;
      layer.paint(tile.ctx, tile.z, tile.sources, bboxes);
    });
    tile.rendered = true;
    return callback(null, tile);
  }

  function create(z, x, y, cb = () => undefined, reportTime) {
    let t0 = performance.now();

    // Wrap the callback to add time reporting
    function orderTimer(err, tile) { // Track ordering time
      if (err) return cb(err);
      let t1 = performance.now();

      function renderTimer(msg, data) { // Track rendering time
        let t2 = performance.now();
        cb(msg, data, t2 - t1, t1 - t0);
      }

      render(tile, renderTimer);
    }

    return tileFactory.order(z, x, y, orderTimer);
  }

  // Update api
  api.style = styleDoc;
  api.create = create;
  api.redraw = render;
  api.hideLayer = (id) => setLayerVisibility(id, false);
  api.showLayer = (id) => setLayerVisibility(id, true);
  api.sortTasks = tileFactory.sortTasks;

  return api;
}
