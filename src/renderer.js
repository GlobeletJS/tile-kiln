import { getStyleFuncs } from 'tile-stencil';
import { initPainter } from 'tile-painter';

export function initRenderer(styleDoc, canvasSize, queue) {
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

  function drawLayers(tile, callback) {
    const bboxes = [];

    layers.forEach(layer => {
      if (!layer.visible) return;
      layer.paint(tile.ctx, tile.z, tile.sources, bboxes);
    });

    tile.rendered = true;
    tile.rendering = false;

    return callback(null, tile);
  }

  function queueDraw(tile, callback = () => true) {
    if (tile.canceled || !tile.loaded) return;
    if (tile.rendered || tile.rendering) return;

    tile.rendering = true;

    const getPriority = () => tile.priority;
    const chunks = [ () => drawLayers(tile, callback) ];
    queue.enqueueTask({ getPriority, chunks });
  }

  return {
    draw: queueDraw,
    hideLayer: (id) => setLayerVisibility(id, false),
    showLayer: (id) => setLayerVisibility(id, true),
  };
}
