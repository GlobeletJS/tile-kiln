import { initChunkQueue } from "./queue/chunks.js";

export function initRenderer(canvSize, styleGroups) {
  // Input canvSize is an integer, for the pixel size of the (square) tiles
  var activeDrawCalls = 0;

  const queue = initChunkQueue();

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
    draw: drawAll,
    activeDrawCalls: () => activeDrawCalls,
    sortTasks: queue.sortTasks,
  };

  function drawAll(tile, callback = () => true, verbose) {
    if (tile.canceled || !tile.loaded) return;
    if (tile.rendered || tile.rendering) return; // Duplicate call?

    // Flag this tile as in the process of rendering
    tile.rendering = true;
    activeDrawCalls ++;

    // Make an array of functions to draw all the layers of every group
    const drawCalls = [];
    styleGroups
      .filter(grp => grp.visible)
      .forEach( group => drawCalls.push(...makeDrawCalls(group)) );
    drawCalls.push(putTogether);

    // Submit this array to the task queue
    let renderTaskId = queue.enqueueTask({
      chunks: drawCalls,
      getPriority: () => tile.priority,
    });

    // Tell the tile how to cancel the render task
    tile.storeCanceler(() => queue.cancelTask(renderTaskId));

    function makeDrawCalls(group) {
      let drawFuncs = getDrawFuncs(tile, group);
      drawFuncs.push(() => { if (verbose) callback("progress", group.name); });
      return drawFuncs;
    }

    function putTogether() {
      composite(tile);

      tile.rendered = true;
      tile.rendering = false;
      activeDrawCalls --;

      return callback(null, tile);
    }
  }

  function getDrawFuncs(tile, layerGroup) {
    let lamina = getLamina(tile, layerGroup.name);
    if (lamina.rendered) return [() => true];

    lamina.ctx.clearRect(0, 0, canvSize, canvSize);
    const boundingBoxes = [];

    // Create an array of painter calls, one for each layer.
    const drawCalls = layerGroup.layers.map(layer => {
      return () => layer.painter(lamina.ctx, tile.z, tile.sources, boundingBoxes);
    });

    // Add a function to update the rendered flag
    drawCalls.push(() => { lamina.rendered = true; });
    return drawCalls;
  }
}
