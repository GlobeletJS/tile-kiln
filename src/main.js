import { initWorker } from "./boss.js";
import { initChainer } from "./chains.js";
import { loadStyle } from "./style.js";
import { initGroups } from "./groups.js";
import { initTileFactory } from "./tile.js";
import { initRenderer } from "./renderer.js";

export function init(params) {
  // Process parameters, substituting defaults as needed
  var canvSize = params.size || 512;
  var styleURL = params.style;   // REQUIRED
  var mbToken  = params.token;   // May be undefined
  var callback = params.callback || ( () => undefined );

  // Declare some variables & methods that will be defined inside a callback
  var tileFactory, renderer, t0, t1, t2;
  var styleGroups = [];
  var activeDrawCalls = 0;

  function setGroupVisibility(name, visibility) {
    var group = styleGroups.find(group => group.name === name);
    if (group) group.visible = visibility;
  }

  // Initialize a worker thread to read and parse MVT tiles
  const readThread = initWorker("./worker.bundle.js");

  // Initialize handler for chaining functions asynchronously
  const chains = initChainer();

  const api = { // Initialize properties, update when styles load
    style: {},    // WARNING: directly modifiable from calling program

    create: () => undefined,
    hideGroup: (name) => setGroupVisibility(name, false),
    showGroup: (name) => setGroupVisibility(name, true),
    redraw: () => undefined,
    activeDrawCalls: () => activeDrawCalls,
    sortTasks: chains.sortTasks,

    ready: false,
  };

  // Get the style info
  loadStyle(styleURL, mbToken, canvSize, setup);

  return api;

  function setup(err, styleDoc) {
    if (err) callback(err);

    styleGroups = initGroups(styleDoc);

    tileFactory = initTileFactory(canvSize, styleDoc.sources, 
      styleGroups, readThread);
    renderer = initRenderer(canvSize, styleGroups, chains);

    // Update api
    // TODO: we could initialize renderer without styles, then send it the
    // styles when ready. This could avoid the need to rewrite the API.
    api.style = styleDoc;
    api.create = create;

    api.redraw = drawAll;
    api.ready = true;

    return callback(null, api);
  }

  function create(z, x, y, cb = () => undefined, reportTime) {
    if (reportTime) t0 = performance.now();
    var tile = tileFactory(z, x, y, render);
    function render(err) {
      if (err) cb(err);
      if (reportTime) {
        t1 = performance.now();
        cb("Calling drawAll");
      }
      drawAll(tile, cb, reportTime);
    }
    return tile;
  }

  function drawAll(tile, callback = () => true, reportTime) {
    // If tile has been canceled, exit without even executing the callback
    if (tile.canceled) return;

    if (!tile.loaded) return; // Data not ready
    if (tile.rendering || tile.rendered) return; // Duplicate call?

    // Flag this tile as in the process of rendering
    tile.rendering = true;
    activeDrawCalls ++;

    //var numToDo = styleGroups.length;
    //styleGroups.forEach(group => {
    //  if (!group.visible) return;
    //  let cb = (err, tile) => checkAll(err, tile, group.name);
    //  renderer.drawGroup(tile, group.name, cb);
    //});

    // Make a chain of functions to draw each group
    const drawCalls = styleGroups.filter(grp => grp.visible).map(makeDrawCall);

    function makeDrawCall(group) {
      // Wrap a drawGroup call to make a function taking only a callback
      // as an argument
      return (cb) => {
        // Modify the callback to check the tile first
        let checkCb = (err, tile) => {
          check(err, tile, group.name);
          cb();
        };
        renderer.drawGroup(tile, group, checkCb);
      };
    }

    // Execute the chain, with putTogether as the final callback
    chains.chainAsyncList(drawCalls, putTogether, tile.id);

    function putTogether() {
      renderer.composite(tile);

      tile.rendered = true;
      tile.rendering = false;
      activeDrawCalls --;

      if (!reportTime) return callback(null, tile);
      t2 = performance.now();
      return callback(null, tile, t2 - t1, t1 - t0);
    }

    function check(err, tile, groupName) {
      if (err) return callback(err);
      if (reportTime) {
        let dt = (performance.now() - t0).toFixed(1);
        callback("check: " + groupName + ", dt = " + dt + "ms");
      }
    }

    function checkAll(err, tile, groupName) {
      check(err, tile, groupName);
      if (--numToDo > 0) return;
      return putTogether();
    }
  }
}
