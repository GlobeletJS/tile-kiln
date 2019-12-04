import { initWorker } from "./load-mvt/boss.js";
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

  function setGroupVisibility(name, visibility) {
    var group = styleGroups.find(group => group.name === name);
    if (group) group.visible = visibility;
  }

  // Initialize a worker thread to read and parse MVT tiles
  const readThread = initWorker("./worker.bundle.js");

  const api = { // Initialize properties, update when styles load
    style: {},    // WARNING: directly modifiable from calling program

    create: () => undefined,
    hideGroup: (name) => setGroupVisibility(name, false),
    showGroup: (name) => setGroupVisibility(name, true),
    redraw: () => undefined,
    activeDrawCalls: () => 0,
    sortTasks: () => undefined,

    ready: false,
  };

  // Get the style info
  loadStyle(styleURL, mbToken, canvSize)
    .then( setup )
    .catch(err => callback(err));

  return api;

  function setup(styleDoc) {
    styleGroups = initGroups(styleDoc);

    tileFactory = initTileFactory(canvSize, styleDoc.sources, 
      styleGroups, readThread);
    renderer = initRenderer(canvSize, styleGroups);

    // Update api
    api.style = styleDoc;
    api.create = create;

    api.redraw = renderer.draw;
    api.activeDrawCalls = renderer.activeDrawCalls;
    api.sortTasks = renderer.sortTasks;

    api.ready = true;

    return callback(null, api);
  }

  function create(z, x, y, cb = () => undefined, reportTime) {
    if (reportTime) t0 = performance.now();
    var tile = tileFactory(z, x, y, render);
    function render(err) {
      if (err) cb(err);

      var wrapCb = cb;
      if (reportTime) {
        t1 = performance.now();
        cb("Calling drawAll");
        // Wrap the callback to add time reporting
        wrapCb = (msg, data) => {
          if (msg === "progress") {
            let dt = (performance.now() - t0).toFixed(1);
            return cb("check: " + data + ", dt = " + dt + "ms");
          } else if (msg === null) {
            t2 = performance.now();
            return cb(null, data, t2 - t1, t1 - t0);
          } else {
            console.log("ERROR in wrapCb: don't understand the message");
            return cb(msg);
          }
        };
      }
      renderer.draw(tile, wrapCb, reportTime);
    }
    return tile;
  }
}
