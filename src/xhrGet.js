// Wrap XMLHttpRequest to execute a callback with an (err, data) signature
export function xhrGet(href, type, callback) {

  var req = new XMLHttpRequest();
  req.responseType = type;

  // Add handlers for error, abort, load. Ignore all others
  req.onerror = errHandler;
  req.onabort = errHandler;
  req.onload = loadHandler;

  req.open('get', href);
  req.send();

  var err = {};

  function errHandler(e) {
    err.type = e.type;
    err.message = "XMLHttpRequest ended with an " + e.type;
    return callback(err);
  }
  function loadHandler(e) {
    if (req.responseType !== type) {
      err.type = "TypeError";
      err.message = "XMLHttpRequest: Wrong responseType. Expected " +
        type + ", got " + req.responseType;
      return callback(err, req.response);
    }
    if (req.status === 404) {
      err.type = 404;
      err.message = "XMLHttpRequest: HTTP 404 error from " + href;
      return callback(err, req.response);
    }
    return callback(null, req.response);
  }

  // Return the request, just in case we want to abort it with req.abort()
  return req;
}
