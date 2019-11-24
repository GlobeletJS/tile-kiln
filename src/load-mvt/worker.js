import { readMVT } from "./read.js";
import { mergeMacrostrat } from "./macrostrat.js";

const tasks = {};

onmessage = function(msgEvent) {
  // The message DATA as sent by the parent thread is now a property 
  // of the message EVENT. See
  // https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
  const {id, type, payload} = msgEvent.data;

  switch (type) {
    case "start":
      let callback = (err, result) => sendHeader(id, err, result);
      let request  = readMVT(payload.href, payload.size, callback);
      tasks[id] = { request, status: "requested" };
      break;
    case "continue":
      sendData(id);
      break;
    case "cancel":
      let task = tasks[id];
      if (task && task.status === "requested") task.request.abort();
      delete tasks[id];
      break;
    default:
      // Bad message type!
  }
}

function sendHeader(id, err, result) {
  // Make sure we still have an active task for this ID
  let task = tasks[id];
  if (!task) return;  // Task must have been canceled

  if (err) {
    delete tasks[id];
    return postMessage({ id, type: "error", payload: err });
  }

  if (result["units"] !== undefined) {
    // Merge Macrostrat polygons with the same .id
    result["units"] = mergeMacrostrat(result["units"]);
  }

  task.result = result;
  task.layers = Object.keys(result);
  task.status = "parsed";

  // Send a header with info about each layer
  const header = {};
  task.layers.forEach(key => { header[key] = result[key].features.length; });
  postMessage({ id, type: "header", payload: header });
}

function sendData(id) {
  // Make sure we still have an active task for this ID
  let task = tasks[id];
  if (!task) return;  // Task must have been canceled

  var currentLayer = task.result[task.layers[0]];
  // Make sure we still have data in this layer
  if (currentLayer && currentLayer.features.length == 0) {
    task.layers.shift();           // Discard this layer
    currentLayer = task.result[task.layers[0]];
  }
  if (task.layers.length == 0) {
    delete tasks[id];
    postMessage({ id, type: "done" });
    return;
  }

  // Get the next chunk of data and send it back to the main thread
  let chunk = getChunk(currentLayer.features);
  postMessage({ id, type: "data", key: task.layers[0], payload: chunk });
}

function getChunk(arr) {
  const maxChunk = 100000; // 100 KB

  let chunk = [];
  let chunkSize = 0;

  while (arr[0] && chunkSize < maxChunk) {
    let item = arr.shift();
    chunkSize += JSON.stringify(item).length;
    chunk.push(item);
  }

  return chunk;
}
