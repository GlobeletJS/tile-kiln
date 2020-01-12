import { initSources } from "./sources.js";

export function initTileFactory(styleDoc, canvasSize, nThreads) {

  const retriever = initSources(styleDoc, nThreads);

  function order(z, x, y, callback = () => true) {
    let img = document.createElement("canvas");
    img.width = img.height = canvasSize;

    const tile = {
      z, x, y,
      id: z + "/" + x + "/" + y,
      priority: 0,

      img,
      ctx: img.getContext("2d"),
      rendered: false,
    };

    const loadTask = retriever.collect({
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
      return callback(null, tile);
    }

    return tile;
  }

  return { 
    order,
    sortTasks: retriever.sortTasks,
  };
}
