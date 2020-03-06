import { loadStyle } from 'tile-stencil';
import * as chunkedQueue from 'chunked-queue';
import { initTileFactory } from "./tile.js";
import { initRenderer } from "./renderer.js";

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
  const queue = chunkedQueue.init();
  const orderTile = initTileFactory(styleDoc, canvSize, queue, nThreads);
  const renderer = initRenderer(styleDoc, canvSize, queue);

  function create(z, x, y, cb = () => undefined, reportTime) {
    // Wrap the callback to add time reporting
    let t0 = performance.now();

    function orderTimer(err, tile) { // Track ordering time
      if (err) return cb(err);
      let t1 = performance.now();

      function renderTimer(msg, data) { // Track rendering time
        let t2 = performance.now();
        cb(msg, data, t2 - t1, t1 - t0);
      }

      renderer.draw(tile, renderTimer);
    }

    return orderTile(z, x, y, orderTimer);
  }

  // Update api
  api.style = styleDoc;
  api.create = create;
  api.redraw = renderer.draw;
  api.hideLayer = renderer.hideLayer;
  api.showLayer = renderer.showLayer;
  api.sortTasks = queue.sortTasks;

  return api;
}
