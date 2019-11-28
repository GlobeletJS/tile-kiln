initZeroTimeouts();

function initZeroTimeouts() {
  // Like setTimeout, but without the (browser-dependent) minimum delay.
  // Why? The supplied callback will be bumped to the back of the task queue,
  // allowing more critical tasks (like user interaction, screen rendering)
  // to finish first. But if the task queue is empty, the callback will be 
  // executed immediately.
  // Useful for splitting up long-running tasks across frames. See 
  // https://dbaron.org/log/20100309-faster-timeouts

  const timeouts = [];
  var taskId = 0;

  // Make a unique message, that won't be confused with messages from
  // other scripts or browser tabs
  const messageKey = "zeroTimeout_$" + Math.random().toString(36).slice(2);

  // Make it clear where the messages should be coming from
  const loc = window.location;
  var targetOrigin = loc.protocol + "//" + loc.hostname;
  if (loc.port !== "") targetOrigin += ":" + loc.port;

  // When a message is received, execute a timeout from the list
  window.addEventListener("message", evnt => {
    if (evnt.source != window || evnt.data !== messageKey) return;
    evnt.stopPropagation();

    let task = timeouts.shift();
    if (!task || task.canceled) return;
    task.func(...task.args);
  }, true);

  // Now define the external functions to set or cancel a timeout
  window.setZeroTimeout = function(func, ...args) {
    timeouts.push({ id: taskId++, func, args });
    window.postMessage(messageKey, targetOrigin);
    return taskId;
  }

  window.cancelZeroTimeout = function(id) {
    let task = timeouts.find(timeout => timeout.id === id);
    if (task) task.canceled = true;
  }
}
