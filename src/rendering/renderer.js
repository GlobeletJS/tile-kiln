import { initPainter } from "./painter.js";

export function initRenderer(canvSize, styleLayers, styleGroups, sprite, chains) {
  // Input canvSize is an integer, for the pixel size of the (square) tiles
  // Input styleLayers points to the .layers property of a Mapbox style document
  //   Specification: https://docs.mapbox.com/mapbox-gl-js/style-spec/
  // Input styleGroups is a list of style layer groups identified by a
  //   "tilekiln-group" property of each layer
  // Input sprite (if defined) is an object with image and meta properties

  // Parse the styles into rendering functions, attached to the styles
  styleLayers.forEach(layer => {
    layer.painter = initPainter(canvSize, layer, sprite);
  });

  // Sort styles into groups
  const styles = {};
  styleGroups.forEach( group => {
    styles[group.name] = sortStyleGroup(styleLayers, group.name);
  });

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

  function drawGroup(tile, groupName = "none", callback = () => undefined) {
    if (!styles[groupName]) return callback(null, tile);
    let lamina = getLamina(tile, groupName);
    if (lamina.rendered) return callback(null, tile);

    lamina.ctx.clearRect(0, 0, canvSize, canvSize);
    const boundingBoxes = [];

    // Draw the layers: asynchronously, but in order
    // Create a chain of functions, one for each layer.
    const drawCalls = styles[groupName].map(layer => {
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

function sortStyleGroup(layers, groupName) {
  // Get the layers belonging to this group
  var group = (groupName === "none")
    ? layers.filter(layer => !layer["tilekiln-group"]) // Layers with no group specified
    : layers.filter(layer => layer["tilekiln-group"] === groupName);

  // Reverse the order of the symbol layers
  var labels = group.filter(layer => layer.type === "symbol").reverse();

  // Append reordered symbol layers to non-symbol layers
  return group.filter(layer => layer.type !== "symbol").concat(labels);
}
