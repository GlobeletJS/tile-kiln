export function initRenderer(canvSize, styleGroups, chains) {
  // Input canvSize is an integer, for the pixel size of the (square) tiles

  var getLamina, composite;
  if (styleGroups.length > 1) { 
    // Define function to return the appropriate lamina (partial rendering)
    getLamina = (tile, groupName) => tile.laminae[groupName];
    // Define function to composite all laminae canvases into the main canvas
    composite = (tile) => {
      tile.ctx.clearRect(0, 0, canvSize, canvSize);
      styleGroups.forEach( group => {
        if (!group.visible) return;
        tile.ctx.drawImage(tile.laminae[group.name].img, 0, 0);
      });
    };
  } else {
    // Only one group of style layers. Render directly to the main canvas
    getLamina = (tile, groupName) => tile;
    // Compositing is not needed: return a dummy no-op function
    composite = (tile) => true;
  }

  return {
    drawGroup,
    composite,
  };

  function drawGroup(tile, layerGroup, callback = () => undefined) {
    let lamina = getLamina(tile, layerGroup.name);
    if (lamina.rendered) return callback(null, tile);

    lamina.ctx.clearRect(0, 0, canvSize, canvSize);
    const boundingBoxes = [];

    // Draw the layers: asynchronously, but in order
    // Create a chain of functions, one for each layer.
    const drawCalls = layerGroup.layers.map(layer => {
      return () => layer.painter(lamina.ctx, tile.z, tile.sources, boundingBoxes);
    });
    // Execute the chain, with copyResult as the final callback
    chains.chainSyncList(drawCalls, returnResult, tile.id);

    function returnResult() {
      lamina.rendered = true;
      return callback(null, tile);
    }
  }
}
