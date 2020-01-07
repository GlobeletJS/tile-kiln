import { initWorker } from "./load-mvt/boss.js";
import { loadImage } from "./image.js";
import { loadGeotiff } from "./imageGeotiff.js";

export function initTileFactory(size, sources) {
  // Input size is the pixel size of the canvas used for vector rendering
  // Input sources is an OBJECT of TileJSON descriptions of tilesets

  // Initialize a worker thread to read and parse MVT tiles
  const loader = initWorker("./worker.bundle.js");

  // For now we ignore sources that don't have tile endpoints
  const tileSourceKeys = Object.keys(sources).filter( k => {
    return sources[k].tiles && sources[k].tiles.length > 0;
  });

  function orderTile(z, x, y, callback = () => true) {
    let img = document.createElement("canvas");
    img.width = img.height = size;
    const cancelers = [];

    const tile = {
      z, x, y,
      id: z + "/" + x + "/" + y,
      priority: 0,

      sources: {},
      loaded: false,

      img,
      ctx: img.getContext("2d"),
      rendered: false,

      storeCanceler: (canceler) => cancelers.push(canceler),
      cancel,
      canceled: false,
    };

    const loadTasks = {};
    var numToDo = tileSourceKeys.length;
    tileSourceKeys.forEach( loadTile );

    function loadTile(srcKey) {
      var src = sources[srcKey];
      if (src.type === "geotiff"){
        var z_gdal=src.maxzoom-z; //maxzoom= number of zoom levels gdal created
        var x_gdal=y+1;
        var y_gdal=x+1;
        if (z>3 & x_gdal<10){x_gdal = "0"+x_gdal;}
        if (z>3 & y_gdal<10){y_gdal = "0"+y_gdal;}
        var tileHref = tileURL(src.tiles[0], z_gdal, x_gdal, y_gdal);
      }else{
        var tileHref = tileURL(src.tiles[0], z, x, y);
      }
      
      if (src.type === "vector") {
        //readMVT( tileHref, size, (err, data) => checkData(err, srcKey, data) );
        let readCallback = (err, data) => checkData(err, srcKey, data);
        let readPayload = { href: tileHref, size: size };
        loadTasks[srcKey] = loader.startTask(readPayload, readCallback);
      } else if (src.type === "raster") { 
        loadImage( tileHref, (err, data) => checkData(err, srcKey, data) );
      } else if (src.type === "geotiff") {
        loadGeotiff( tileHref, (err, data) => checkData(err, srcKey, data) );
      }
    }

    function cancel() {
      while (cancelers.length > 0) cancelers.shift()();
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

function tileURL(endpoint, z, x, y) {
  return endpoint.replace(/{z}/, z).replace(/{x}/, x).replace(/{y}/, y);
}
