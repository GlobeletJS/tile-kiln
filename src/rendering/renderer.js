import { getFeatures } from "./getFeatures.js";
import { initRoller } from "./roller.js";
import { brush } from "./brush.js";
import { initLabeler } from "./labeler.js";

export function initRenderer(canvSize, styleLayers, styleGroups, sprite, chains) {
  // Input canvSize is an integer, for the pixel size of the (square) tiles
  // Input styleLayers points to the .layers property of a Mapbox style document
  //   Specification: https://docs.mapbox.com/mapbox-gl-js/style-spec/
  // Input styleGroups is a list of style layer groups identified by a
  //   "tilekiln-group" property of each layer
  // Input sprite (if defined) is an object with image and meta properties

  // Initialize roller, to paint single layers onto the canvas
  const roller = initRoller(canvSize);

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
    const labeler = initLabeler(sprite);

    //styles[groupName].forEach( style => drawLayer(style, tile.z, tile.sources) );

    // Draw the layers: asynchronously, but in order
    // Create a chain of functions, one for each layer.
    const drawCalls = styles[groupName].map(style => {
      let link = () => drawLayer(lamina.ctx, labeler, style, tile.z, tile.sources);
      return chains.cbWrapper(link);
    });
    // Execute the chain, with copyResult as the final callback
    chains.callInOrder(drawCalls, returnResult);

    function returnResult() {
      lamina.rendered = true;
      return callback(null, tile);
    }
  }

  function drawLayer(ctx, labeler, style, zoom, sources) {
    // Quick exits if this layer is not meant to be displayed
    if (style.layout && style.layout["visibility"] === "none") return;
    if (style.minzoom !== undefined && zoom < style.minzoom) return;
    if (style.maxzoom !== undefined && zoom > style.maxzoom) return;

    // Start from default canvas state: restore what we saved
    ctx.restore();
    // restore POPS the saved state off a stack. So if we want to restore again
    // later, we need to re-save what we just restored
    ctx.save();

    let type = style.type;
    if (type === "background") return roller.fillBackground(ctx, style, zoom);

    var source = sources[ style["source"] ];
    if (!source) return;

    if (type === "raster") return roller.drawRaster(ctx, style, zoom, source);

    var mapLayer = source[ style["source-layer"] ];
    var mapData = getFeatures(mapLayer, style.filter);
    if (!mapData) return;

    return (type === "symbol") 
      ? labeler(ctx, style, zoom, mapData)
      : brush(ctx, style, zoom, mapData);
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
