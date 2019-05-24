import { readMVT, loadImage } from "./read.js";

// TODO: Move this to a worker thread. readMVT is CPU intensive
// Also, convert images to ImageBitmaps?
export function initTileFactory(size, sources) {
  // Input size is the pixel size of the canvas used for vector rendering
  // Input sources is an OBJECT of TileJSON descriptions of tilesets

  // For now we ignore sources that don't have tile endpoints
  const tileSourceKeys = Object.keys(sources).filter( k => {
    return sources[k].tiles && sources[k].tiles.length > 1;
  });

  function orderTile(z, x, y, callback = () => true) {
    const tile = {
      z, x, y,
      sources: {},
      ready: false,
    };

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

      tile.ready = true;
      return callback(null, tile);
    }
    return tile;
  }

  return orderTile;
}

function tileURL(endpoint, z, x, y) {
  return endpoint.replace(/{z}/, z).replace(/{x}/, x).replace(/{y}/, y);
}
