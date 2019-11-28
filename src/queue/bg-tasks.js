// Shims to imitate the Background Tasks API in Safari and Edge
// https://developer.mozilla.org/en-US/docs/Web/API/Background_Tasks_API

window.requestIdleCallback = window.requestIdleCallback || function(handler) {
  let startTime = Date.now();

  // NOTE: multiple setTimeouts may clog up a frame time?
  // Don't know if a requestAnimationFrame callback can interrupt 
  // a series of setTimeout callbacks
  return setTimeout(function() {
    handler({
      didTimeout: false,
      // NOTE: very different from the native method. Returns time since
      // the callback was submitted, NOT an estimate of remaining idle time
      timeRemaining: () => Math.max(0, 50.0 - (Date.now() - startTime));
    });
  }, 1);
}

window.cancelIdleCallback = window.cancelIdleCallback || function(id) {
  clearTimeout(id);
}
