import { readMVT } from "./read.js";
import { mergeMacrostrat } from "./macrostrat.js";

onmessage = function(msgEvent) {
  // The message DATA as sent by the parent thread is now a property 
  // of the message EVENT. See
  // https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
  const {id, payload} = msgEvent.data;

  readMVT(payload.href, payload.size, returnResult);

  function returnResult(err, result) {
    var msg;
    if (err) return postMessage({ id, type: "error", payload: err });

    if (result["units"] !== undefined) {
      // Merge Macrostrat polygons with the same .id
      result["units"] = mergeMacrostrat(result["units"]);
    }

    // Send a header with info about each layer
    const header = {};
    const layerNames = Object.keys(result);
    layerNames.forEach(key => {
      header[key] = result[key].features.length;
    });
    postMessage({ id, type: "header", payload: header });

    // Send the data for each layer, one layer at a time
    layerNames.forEach( key => sendChunks(key, result[key].features) );

    // Break the layer down into smaller chunks
    function sendChunks(key, features) {
      let dataChunks = makeChunks(features);
      dataChunks.forEach( chunk => sendChunk(key, chunk) );
    }
    function sendChunk(key, chunk) {
      postMessage({ id, type: "data", key, payload: chunk });
    }

    // Send a message to confirm we are done
    postMessage({ id, type: "done" });
  }
}

function makeChunks(arr) {
  const maxChunk = 100000; // 100 KB

  let len = arr.length;
  let i = 0;
  let chunks = [];

  while (i < len) {
    let chunk = [];
    let chunkSize = 0;
    while (i < len && chunkSize < maxChunk) {
      chunkSize += JSON.stringify(arr[i]).length;
      chunk.push(arr[i]);
      i++;
    }
    chunks.push(chunk);
  }

  return chunks;
}
