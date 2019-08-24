export function initChainer() {
  const timeouts = [];

  const messageName = "zero-timeout-message";
  window.addEventListener("message", handleMessage, true);

  return {
    sortTasks,
    chainSyncList,
    chainAsyncList,
  };

  function sortTasks(ranking) {
    // Rank each task according to the supplied ranking function
    timeouts.forEach( task => { task.rank = ranking(task.id); } );
    // Sort tasks: smaller rank number (or undefined rank) first
    timeouts.sort( (a, b) => (a.rank > b.rank) ? 1 : -1 );
  }

  function chainSyncList(funcs, finalCallback, taskId) {
    // Input funcs is an array of synchronous zero-argument functions
    // Turn them into asynchronous functions taking a callback
    const cbFuncs = funcs.map( func => (cb) => {
      func();
      setZeroTimeout(cb, taskId);
    });

    // Execute them as a chain. Start the chain asynchronously
    setZeroTimeout( () => callInOrder(cbFuncs, finalCallback), taskId );
  }

  function chainAsyncList(funcs, finalCallback, taskId) {
    // Input funcs is an array of functions taking a callback as an argument.
    // Wrap them to make the callbacks asynchronous and ID'd
    const wrapFuncs = funcs.map( func => (cb) => {
      func( () => setZeroTimeout(cb, taskId) );
    });

    // Execute them as a chain. Start the chain asynchronously
    setZeroTimeout( () => callInOrder(wrapFuncs, finalCallback), taskId );
  }

  // http://derpturkey.com/chained-callback-pattern-in-javascript/
  function callInOrder(funcs, finalCallback) {
    funcs.push(finalCallback);
    chain(funcs.shift());

    function chain(func) {
      if (func) func( () => chain(funcs.shift()) );
    }
  }

  // https://dbaron.org/log/20100309-faster-timeouts
  // func is a function taking zero arguments
  function setZeroTimeout(func, id) {
    timeouts.push({ id, func, rank: 0 });

    // Don't let this message be picked up by another window:
    // set the targetOrigin to the current window origin
    let loc = window.location;
    let targetOrigin = loc.protocol + "//" + loc.hostname;
    if (loc.port !== "") targetOrigin += ":" + loc.port;

    window.postMessage(messageName, targetOrigin);
  }

  function handleMessage(evnt) {
    if (evnt.source != window || evnt.data !== messageName) return;
    evnt.stopPropagation();
    if (timeouts.length < 1) return;

    let task = timeouts.shift();
    // If task rank is undefined, this task has been canceled.
    if (task.rank !== undefined) task.func();
  }
}
