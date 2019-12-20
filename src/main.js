import { parseStyle } from 'tile-stencil';
import { addPainters } from 'tile-painter';
import { initGroups, addLaminae } from "./groups.js";
import { initTileFactory } from "./tile.js";
import { initRenderer } from "./renderer.js";

export function init(params) {
  // Process parameters, substituting defaults as needed
  var canvSize = params.size || 512;
  var styleURL = params.style;   // REQUIRED
  var mbToken  = params.token;   // May be undefined

  // Get the style info, then set everything up
  return parseStyle(styleURL, mbToken)
    .then( style => addPainters(style, canvSize) )
    .then( style => setup(style, canvSize) );
}

function setup(styleDoc, canvSize) {
  const styleGroups = initGroups(styleDoc);

  const tileFactory = initTileFactory(canvSize, styleDoc.sources);
  const renderer = initRenderer(styleGroups);

  return {
    style: styleDoc, // WARNING: directly modifiable from calling program

    create,
    redraw: renderer.draw,
    hideGroup: (name) => setGroupVisibility(name, false),
    showGroup: (name) => setGroupVisibility(name, true),

    activeDrawCalls: renderer.activeDrawCalls,
    sortTasks: renderer.sortTasks,
  };

  function create(z, x, y, cb = () => undefined, reportTime) {
    let t0 = performance.now();

    var tile = tileFactory(z, x, y, render);
    if (styleGroups.length > 1) addLaminae(tile, styleGroups);

    function render(err) {
      if (err) return cb(err);

      // Wrap the callback to add time reporting
      var wrapCb = cb;
      if (reportTime) {
        let t1 = performance.now();
        wrapCb = (msg, data) => {
          let t2 = performance.now();
          return cb(null, data, t2 - t1, t1 - t0);
        };
      }
      renderer.draw(tile, wrapCb);
    }

    return tile;
  }

  function setGroupVisibility(name, visibility) {
    var group = styleGroups.find(group => group.name === name);
    if (group) group.visible = visibility;
  }
}
