import { loadStyle } from "./style.js";
import { initWorker } from "./boss.js";
import { initTileFactory } from "./tile.js";
import { initRenderer } from "./rendering/renderer.js";

export function init(params) {
  // Process parameters, substituting defaults as needed
  var canvSize = params.size || 512;
  var styleURL = params.style;   // REQUIRED
  var mbToken  = params.token;   // May be undefined
  var callback = params.callback || ( () => undefined );

  // Declare some variables & methods that will be defined inside a callback
  var groupNames, tileFactory, renderer, t1, t2;
  var styleGroups = [];

  function setGroupVisibility(name, visibility) {
    var group = styleGroups.find(group => group.name === name);
    if (group) group.visible = visibility;
  }

  const api = { // Initialize properties, update when styles load
    style: {},    // WARNING: directly modifiable from calling program
    create: () => undefined,
    drawGroup: (group) => undefined,
    hideGroup: (name) => setGroupVisibility(name, false),
    showGroup: (name) => setGroupVisibility(name, true),
    composite: () => undefined,
    redraw: () => undefined,
    groups: [],
    ready: false,
  };

  // Initialize a worker thread to read and parse MVT tiles
  const readThread = initWorker("./worker.bundle.js");

  // Get the style info
  loadStyle(styleURL, mbToken, setup);

  return api;

  function setup(err, styleDoc) {
    if (err) callback(err);

    // Get layer group names from styleDoc
    groupNames = styleDoc.layers
      .map( layer => layer["tilekiln-group"] || "none" )
      .filter(uniq);

    // Make sure the groups in order, not interleaved
    var groupCheck = groupNames.slice().sort().filter(uniq);
    if (groupNames.length !== groupCheck.length) {
      err = "tilekiln setup: Input layer groups are not in order!";
      return callback(err);
    }
    
    function uniq(x, i, a) {
      return ( !i || x !== a[i-1] ); // x is not a repeat of the previous value
    }

    // Construct an object to track visibility of each group
    styleGroups = groupNames.map( name => {
      return { name, visible: true };
    });

    tileFactory = initTileFactory(canvSize, styleDoc.sources, 
      styleGroups, readThread.startTask);
    renderer = initRenderer(canvSize, styleDoc.layers, 
      styleGroups, styleDoc.sprite);

    // Update api
    // TODO: we could initialize renderer without styles, then send it the
    // styles when ready. This could avoid the need to rewrite the API.
    api.style = styleDoc;
    api.create = create;
    api.drawGroup = renderer.drawGroup;
    api.composite = renderer.composite;
    api.redraw = drawAll;
    api.ready = true;
    api.groups = groupNames;

    return callback(null, api);
  }

  function create(z, x, y, cb = () => undefined, reportTime) {
    var tile = tileFactory(z, x, y, render);
    function render(err) {
      if (err) cb(err);
      if (reportTime) t1 = performance.now();
      drawAll(tile);
      if (!reportTime) return cb(null, tile);
      t2 = performance.now();
      return cb(null, tile, t2 - t1);
    }
    return tile;
  }

  function drawAll(tile, callback = () => true) {
    styleGroups.forEach( group => renderer.drawGroup(tile, group.name) );
    renderer.composite(tile);
    callback(null, tile);
  }
}
