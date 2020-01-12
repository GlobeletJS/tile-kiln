import { loadStyle, getStyleFuncs } from 'tile-stencil';
import { initPainter } from 'tile-painter';
import { initTileFactory } from "./tile.js";

export function init(params) {
  // Process parameters, substituting defaults as needed
  var canvSize = params.size || 512;
  var styleURL = params.style;   // REQUIRED
  var mbToken  = params.token;   // May be undefined
  var nThreads = params.threads || 4;

  // Get the style info, then set everything up
  return loadStyle(styleURL, mbToken)
    .then( style => setup(style, canvSize, nThreads) );
}

function setup(styleDoc, canvasSize, nThreads) {
  const tileFactory = initTileFactory(styleDoc, canvasSize, nThreads);
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
    const paint = initPainter({ styleLayer, spriteObject, canvasSize });
    return { paint, id: styleLayer.id, visible: true };
  }

  function setLayerVisibility(id, visibility) {
    var layer = layers.find(l => l.id === id);
    if (layer) layer.visible = visibility;
  }

  function render(tile, callback) {
    const bboxes = [];
    layers.forEach(layer => {
      if (!layer.visible) return;
      layer.paint(tile.ctx, tile.z, tile.sources, bboxes);
    });
    return callback(null, tile);
  }

  return {
    style: styleDoc, // WARNING: directly modifiable from calling program

    create,
    redraw: render,
    hideLayer: (id) => setLayerVisibility(id, false),
    showLayer: (id) => setLayerVisibility(id, true),

    sortTasks: tileFactory.sortTasks,
  };

  function create(z, x, y, cb = () => undefined, reportTime) {
    let t0 = performance.now();

    var tile = tileFactory.order(z, x, y, reportAndRender);

    function reportAndRender(err) {
      if (err) return cb(err);

      // Wrap the callback to add time reporting
      var wrapCb = cb;
      if (reportTime) {
        let t1 = performance.now();
        wrapCb = (msg, data) => {
          let t2 = performance.now();
          return cb(null, data, t2 - t1, t1 - t0);
        };
      }
      render(tile, wrapCb);
    }

    return tile;
  }
}
