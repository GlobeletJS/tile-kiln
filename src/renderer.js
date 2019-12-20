import { initChunkQueue } from "./queue.js";

export function initRenderer(styleGroups) {
  var activeDrawCalls = 0;

  const queue = initChunkQueue();

  const chainDrawCalls = (styleGroups.length === 1)
    ? (tile) => getDrawFuncs(tile, styleGroups[0].layers)
    : (tile) => groupDrawCalls(tile, styleGroups);

  return {
    draw: drawAll,
    activeDrawCalls: () => activeDrawCalls,
    sortTasks: queue.sortTasks,
  };

  function drawAll(tile, callback = () => true) {
    if (tile.canceled || !tile.loaded) return;
    if (tile.rendered || tile.rendering) return; // Duplicate call?

    // Flag this tile as in the process of rendering
    tile.rendering = true;
    activeDrawCalls ++;

    // Make an array of functions to draw all the layers
    const drawCalls = chainDrawCalls(tile);
    drawCalls.push(finishTile);

    // Submit this array to the task queue
    let renderTaskId = queue.enqueueTask({
      chunks: drawCalls,
      getPriority: () => tile.priority,
    });

    // Tell the tile how to cancel the render task
    tile.storeCanceler(() => queue.cancelTask(renderTaskId));

    function finishTile() {
      tile.rendering = false;
      activeDrawCalls --;
      return callback(null, tile);
    }
  }
}

function groupDrawCalls(tile, styleGroups) {
  const drawCalls = styleGroups
    .filter( group => group.visible )
    .flatMap( group => getDrawFuncs(tile.laminae[group.name], group.layers) );

  function composite() {
    tile.ctx.clearRect(0, 0, tile.img.width, tile.img.height);
    styleGroups.forEach( group => {
      if (!group.visible) return;
      tile.ctx.drawImage(tile.laminae[group.name].img, 0, 0);
    });
    tile.rendered = true;
  }

  drawCalls.push(composite);
  return drawCalls;
}


function getDrawFuncs(tile, layers) {
  if (tile.rendered) return [() => true];

  tile.ctx.clearRect(0, 0, tile.img.width, tile.img.height);
  const boundingBoxes = [];

  // Create an array of painter calls, one for each layer.
  const drawCalls = layers.map(layer => {
    return () => layer.painter(tile.ctx, tile.z, tile.sources, boundingBoxes);
  });

  // Add a function to update the rendered flag
  drawCalls.push(() => { tile.rendered = true; });
  return drawCalls;
}
