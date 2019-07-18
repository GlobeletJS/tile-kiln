// Wrapper for worker threads to enable a callback interface
// Inspired by https://codeburst.io/promises-for-the-web-worker-9311b7831733
export function initWorker(codeHref) {

  const callbacks = {};
  let globalMsgId = 0;
  let activeTasks = 0;

  const worker = new Worker(codeHref);
  worker.onmessage = handleMsg;

  return {
    startTask: sendMsg,
    numActive: () => activeTasks,
    terminate: worker.terminate,
  }

  function sendMsg(payload, callback) {
    activeTasks ++;
    const msgId = globalMsgId++;
    const msg = { id: msgId, payload };

    callbacks[msgId] = callback;
    worker.postMessage(msg);
  }

  function handleMsg(msgEvent) {
    const { id, err, payload } = msgEvent.data;

    const callback = callbacks[id];
    if (callback) callback(err, payload);

    delete callbacks[id];
    activeTasks --;
  }
}
