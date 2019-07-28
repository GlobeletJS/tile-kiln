// Wrapper for worker threads to enable a callback interface
// Inspired by https://codeburst.io/promises-for-the-web-worker-9311b7831733
export function initWorker(codeHref) {

  const callbacks = {};
  const payloads = {};
  const headers = {};
  let globalMsgId = 0;
  let activeTasks = 0;

  const worker = new Worker(codeHref);
  worker.onmessage = handleMsg;

  return {
    startTask: requestTile,
    numActive: () => activeTasks,
    terminate: worker.terminate,
  }

  function requestTile(payload, callback) {
    activeTasks ++;
    const msgId = globalMsgId++;
    const msg = { id: msgId, type: "request", payload };

    callbacks[msgId] = callback;
    worker.postMessage(msg);
  }

  function handleMsg(msgEvent) {
    const msg = msgEvent.data; // { id, type, key, payload }
    const callback = callbacks[msg.id]; // What if it doesn't exist?

    switch (msg.type) {
      case "error":
        return callback(msg.payload);
      case "header": {
        headers[msg.id] = msg.payload;
        payloads[msg.id] = initJSON(msg.payload);
        let reply = { id: msg.id, type: "continue" };
        worker.postMessage(reply);
        return;
      }
      case "data": {
        let features = payloads[msg.id][msg.key].features;
        msg.payload.forEach( feature => features.push(feature) );
        let reply = { id: msg.id, type: "continue" };
        worker.postMessage(reply);
        return;
      }
      case "done":
        let dataOK = checkJSON(payloads[msg.id], headers[msg.id]);
        if (!dataOK) return callback("ERROR: JSON from worker failed checks!");
        break; // Process result below this loop
      default:
        delete payloads[msg.id];
        delete headers[msg.id];
        return callback("ERROR: worker sent bad message type!");
    }

    callback(null, payloads[msg.id]);

    delete callbacks[msg.id];
    delete payloads[msg.id];
    delete headers[msg.id];
    activeTasks --;
  }
}

function initJSON(header) {
  const json = {};
  Object.keys(header).forEach(key => {
    json[key] = { type: "FeatureCollection", features: [] };
  });
  return json;
}

function checkJSON(json, header) {
  return Object.keys(header).every(checkFeatureCount);

  function checkFeatureCount(key) {
    return json[key].features.length === header[key];
  }
}
