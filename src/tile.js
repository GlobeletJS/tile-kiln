import { loadImage } from "./read.js";

export function initTileFactory(size, sources, styleGroups, loader) {
  // Input size is the pixel size of the canvas used for vector rendering
  // Input sources is an OBJECT of TileJSON descriptions of tilesets
  // Input styleGroups is an ARRAY of objects { name, visible } for groupings of
  // style layers that will be rendered to separate canvases before compositing

  // For now we ignore sources that don't have tile endpoints
  const tileSourceKeys = Object.keys(sources).filter( k => {
    return sources[k].tiles && sources[k].tiles.length > 0;
  });

  function orderTile(z, x, y, callback = () => true) {
    const loadTasks = {};
    var numToDo = tileSourceKeys.length;
    var baseLamina = initLamina(size);

    const tile = {
      z, x, y,
      id: z + "/" + x + "/" + y,
      priority: 0,

      sources: {},
      laminae: {},
      img: baseLamina.img,
      ctx: baseLamina.ctx,

      loaded: false,
      cancel,
      canceled: false,
      rendering: baseLamina.rendering,
      rendered: baseLamina.rendered,
    };

    // Add canvases for separate rendering of layer groups, if supplied
    if (styleGroups && styleGroups.length > 1) {
      styleGroups.forEach( group => {
        tile.laminae[group.name] = initLamina(size);
      });
    }

    tileSourceKeys.forEach( loadTile );

    function loadTile(srcKey) {
      var src = sources[srcKey];
      var tileHref = tileURL(src.tiles[0], z, x, y);
      if (src.type === "vector") {
        //readMVT( tileHref, size, (err, data) => checkData(err, srcKey, data) );
        let readCallback = (err, data) => checkData(err, srcKey, data);
        let readPayload = { href: tileHref, size: size };
        loadTasks[srcKey] = loader.startTask(readPayload, readCallback);
      } else if (src.type === "raster") {
        loadImage( tileHref, (err, data) => checkData(err, srcKey, data) );
      }
    }

    function cancel() {
      Object.values(loadTasks).forEach(task => loader.cancelTask(task));
      tile.canceled = true;
    }

    function checkData(err, key, data) {
      // If data retrieval errors, don't stop. We could be out of the range of
      // one layer, but we may still be able to render the other layers
      if (err) console.log(err);
      // TODO: maybe stop if all layers have errors?

      tile.sources[key] = data;
      delete loadTasks[key];
      if (--numToDo > 0) return;

      tile.loaded = true;
      return callback(null, tile);
    }
    return tile;
  }

  return orderTile;
}

function initLamina(size) {
  let img = document.createElement("canvas");
  img.width = size;
  img.height = size;
  let ctx = img.getContext("2d");
  ctx.save(); // Save default styles
  return { img, ctx, rendering: false, rendered: false };
}

function tileURL(endpoint, z, x, y) {
  return endpoint.replace(/{z}/, z).replace(/{x}/, x).replace(/{y}/, y);
}
