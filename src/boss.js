// Wrapper for worker threads to enable a callback interface
// Inspired by https://codeburst.io/promises-for-the-web-worker-9311b7831733
export function initWorker(codeHref) {

  const tasks = {};
  let globalMsgId = 0;
  let activeTasks = 0;

  const worker = new Worker(codeHref);
  worker.onmessage = handleMsg;

  return {
    startTask,
    cancelTask,
    numActive: () => activeTasks,
    terminate: worker.terminate,
  }

  function startTask(payload, callback) {
    activeTasks ++;
    const msgId = globalMsgId++;
    tasks[msgId] = { callback };
    worker.postMessage({ id: msgId, type: "start", payload });
    return msgId; // Returned ID can be used for later cancellation
  }

  function cancelTask(id) {
    if (tasks[id]) worker.postMessage({ id, type: "cancel" });
    return delete tasks[id];
  }

  function handleMsg(msgEvent) {
    const msg = msgEvent.data; // { id, type, key, payload }
    const task = tasks[msg.id];
    if (!task) return worker.postMessage({ id: msg.id, type: "cancel" });

    switch (msg.type) {
      case "error":
        task.callback(msg.payload);
        break; // Clean up below

      case "header":
        task.header = msg.payload;
        task.result = initJSON(msg.payload);
        return worker.postMessage({ id: msg.id, type: "continue" });

      case "data": 
        let features = task.result[msg.key].features;
        msg.payload.forEach( feature => features.push(feature) );
        return worker.postMessage({ id: msg.id, type: "continue" });

      case "done":
        let err = checkJSON(task.result, task.header)
          ? null
          : "ERROR: JSON from worker failed checks!";
        task.callback(err, task.result);
        break; // Clean up below

      default:
        task.callback("ERROR: worker sent bad message type!");
        break; // Clean up below
    }

    delete tasks[msg.id];
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
