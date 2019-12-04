import { parseStyle }  from 'tile-stencil';
import { initPainter } from 'tile-painter';

export function loadStyle(styleURL, mapboxToken, canvasSize) {
  return parseStyle(styleURL, mapboxToken)
    .then( addPainterFunctions );

  // TODO: move this boilerplate to tile-painter?
  function addPainterFunctions(styleDoc) {
    styleDoc.layers.forEach(layer => {
      layer.painter = initPainter({
        canvasSize: canvasSize,
        styleLayer: layer,
        spriteObject: styleDoc.spriteData,
      });
    });
    return styleDoc;
  }
}
