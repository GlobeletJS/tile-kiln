import { initTileMixer } from 'tile-mixer';
import { initRasterSource } from "./raster.js";
import { initChunkQueue } from "./queue.js";

export function initSources(styleDoc, numThreads = 4) {
  const sources = styleDoc.sources;

  // Initialize queue for main thread scheduling
  const queue = initChunkQueue();

  // Find the number of Worker threads we can use for each vector source
  const nvec = Object.values(sources).filter(s => s.type === "vector").length;
  const threads = (nvec > 0) ? Math.ceil(numThreads / nvec) : nvec;

  // Initialize a data getter for each source (raster or vector tiles only)
  const getters = {};
  Object.entries(sources).forEach( ([key, source]) => {
    if (!source.tiles || source.tiles.length < 1) return;

    if (source.type === "raster") getters[key] = initRasterSource(source);

    if (source.type !== "vector") return;

    // Vector tiles: Get the layers using this source, and initialize mixer
    let layers = styleDoc.layers.filter(l => l.source === key);
    getters[key] = initTileMixer({ threads, source, layers, queue });
  });

  return {
    sortTasks: queue.sortTasks,
    collect,
  };

  function collect({ z, x, y, getPriority, callback }) {
    // Collect data from all soures into one object
    const dataCollection = {};
    const loadTasks = {};
    var numToDo = Object.keys(getters).length;

    Object.entries(getters).forEach( ([key, getter]) => {
      loadTasks[key] = getter.request({
        z, x, y, getPriority, 
        callback: (err, data) => collectData(err, key, data),
      });
    });

    function collectData(err, key, data) {
      if (err) console.log(err);

      dataCollection[key] = data;
      delete loadTasks[key];
      if (--numToDo > 0) return;

      return callback(null, dataCollection);
    }

    // Return a handle that allows for cancellation of ongoing tasks
    const handle = {
      cancel: () => Object.values(loadTasks).forEach(task => task.abort()),
    }

    return handle;
  }
}
