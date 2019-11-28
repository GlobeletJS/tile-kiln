// Shims to imitate the Background Tasks API in Safari and Edge

// Initialize the alternative functions
{ rIC, cIC } = initShims();

window.requestIdleCallback = window.requestIdleCallback || rIC;
window.cancelIdleCallback = window.cancelIdleCallback || cIC;

// Currently assuming a constant 60 frames per second
var activeFrameTime = 16.7; // ms
var currentID = 0;

// TODO: need to implement a FIFO queue -- and maybe an alternate sorter?
const ids = [];

// Need to wrap this in an initializer 
function rIC(callback, options) {
  // Store the request time, for checking the timeout
  const requestTime = performance.now();
  var cbID, rafID, rafTime;

  // Set up an animation, just to keep track of frame timings
  // BTW if we already have a loop running, don't need another one? TODO
  rafID = requestAnimationFrame(animationTick);

  // Push this task onto the queue... TODO
  // Also, what about callback arguments??
  // Return an ID that can be used to cancel the callback TODO
  return cbID;

  function animationTick(time) {
    rafTime = time;
    rafID = requestAnimationFrame(animationTick);

    // Don't run the callback yet. Need to make sure other, more critical
    // callbacks have run first, as well as the repaint
    // TODO: better to implement a setZeroTimeout function?
    window.postMessage(messageName, targetOrigin);
  }

  // If we get to the message handler, we might have time for callback TODO


  return setTimeout(function() {
    handler({
      didTimeout: false,
      // NOTE: very different from the native method. Returns time since
      // the callback was submitted, NOT an estimate of remaining idle time
      timeRemaining: () => Math.max(0, 50.0 - (Date.now() - startTime));
    });
  }, 1);
}


