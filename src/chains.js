export function initChainer() {
  const timeouts = [];
  const messageName = "zero-timeout-message";

  window.addEventListener("message", handleMessage, true);

  return {
    cbInserter,
    cbWrapper,
    callInOrder,
  };

  // https://dbaron.org/log/20100309-faster-timeouts
  function setZeroTimeout(fn) {
    timeouts.push(fn);
    window.postMessage(messageName, "*");
  }

  function handleMessage(evnt) {
    if (evnt.source != window || evnt.data !== messageName) return;
    evnt.stopPropagation();
    if (timeouts.length < 1) return;
    var fn = timeouts.shift();
    fn();
  }

  function cbInserter(func) {
    // Return a wrapper function that will execute func, passing in
    // a supplied callback
    return (cb) => {
      //func( () => setTimeout(cb) );
      func( () => setZeroTimeout(cb) );
    }
  }

  function cbWrapper(func) {
    // Return a wrapper function that will execute func (synchronously)
    // and then a supplied callback
    return (cb) => {
      func();
      //setTimeout(cb); // setTimeout ensures asynchronicity
      setZeroTimeout(cb); // setTimeout ensures asynchronicity
    };
  }

  // http://derpturkey.com/chained-callback-pattern-in-javascript/
  function callInOrder(funcs, finalCallback) {
    funcs.push(finalCallback);
    chain(funcs.shift());

    function chain(func) {
      if (func) func( () => chain(funcs.shift()) );
    }
  }
}
