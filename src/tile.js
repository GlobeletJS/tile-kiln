import { readMVT, loadImage } from "./read.js";

// TODO: Move this to a worker thread. readMVT is CPU intensive
// Also, convert images to ImageBitmaps?
export function initTileFactory(size, sources, layerGroupNames) {
  // Input size is the pixel size of the canvas used for vector rendering
  // Input sources is an OBJECT of TileJSON descriptions of tilesets
  // Input layerGroupNames is an ARRAY of names for groupings of style layers
  //   that will be rendered to separate canvases before compositing

  // For now we ignore sources that don't have tile endpoints
  const tileSourceKeys = Object.keys(sources).filter( k => {
    return sources[k].tiles && sources[k].tiles.length > 0;
  });

  function orderTile(z, x, y, callback = () => true) {
    var baseLamina = initLamina(size);
    const tile = {
      z, x, y,
      sources: {},
      loaded: false,
      img: baseLamina.img,
      ctx: baseLamina.ctx,
      rendered: baseLamina.rendered,
      laminae: {},
    };

    // Add canvases for separate rendering of layer groups, if supplied
    if (layerGroupNames && layerGroupNames.length > 1) {
      layerGroupNames.forEach( group => {
        tile.laminae[group] = initLamina(size);
      });
    }

    var numToDo = tileSourceKeys.length;
    tileSourceKeys.forEach( loadTile );

    function loadTile(srcKey) {
      var src = sources[srcKey];
      var tileHref = tileURL(src.tiles[0], z, x, y);
      if (src.type === "vector") {
        readMVT( tileHref, size, (err, data) => checkData(err, srcKey, data) );
      } else if (src.type === "raster") {
        loadImage( tileHref, (err, data) => checkData(err, srcKey, data) );
      }
    }

    function checkData(err, key, data) {
      if (err) return callback(err);

      tile.sources[key] = data;
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
  return { 
    img, 
    ctx: img.getContext("2d"),
    rendered: false,
  };
}

function tileURL(endpoint, z, x, y) {
  return endpoint.replace(/{z}/, z).replace(/{x}/, x).replace(/{y}/, y);
}