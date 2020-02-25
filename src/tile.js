import { initSources } from "./sources.js";

export function initTileFactory(styleDoc, canvasSize, queue, nThreads) {

  const getData = initSources(styleDoc, queue, nThreads);

  return function order(z, x, y, callback = () => true) {
    let img = document.createElement("canvas");
    img.width = img.height = canvasSize;

    const tile = {
      z, x, y,
      id: z + "/" + x + "/" + y,
      priority: 0,
      zoomOverMax: 0, //Options to stretch image when z>maxzoom
      xIndex: 0,  
      yIndex: 0,
      cropSize: 512,

      img,
      ctx: img.getContext("2d"),
      rendered: false,
    };

    const loadTask = getData({
      z, x, y,
      getPriority: () => tile.priority,
      callback: addData,
    });

    tile.cancel = () => {
      loadTask.cancel();
      tile.canceled = true;
    }

    function addData(err, data) {
      if (err) console.log(err);
      tile.sources = data;
      tile.loaded = true;
      if(z> styleDoc.sources[Object.getOwnPropertyNames(data)[0]].maxzoom){
        tile.zoomOverMax = z- styleDoc.sources[Object.getOwnPropertyNames(data)[0]].maxzoom;
        tile.cropSize = 512/Math.pow(2, tile.zoomOverMax);
        tile.xIndex = (tile.x%(Math.pow(2, tile.zoomOverMax)))*tile.cropSize;
        tile.yIndex = (tile.y%(Math.pow(2, tile.zoomOverMax)))*tile.cropSize;
      }
      return callback(null, tile);
    }
    return tile;
  }
}
