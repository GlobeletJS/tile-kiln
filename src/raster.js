export function initRasterSource(source) {
  const getURL = initUrlFunc(source.tiles);

  function request({z, x, y, callback}) {
    const href = getURL(z, x, y);
    console.log("z:"+z);
    const errMsg = "ERROR in loadImage for href " + href;

    const img = new Image();
    img.onerror = () => callback(errMsg);
    img.onload = () => (img.complete && img.naturalWidth !== 0)
      ? callback(null, img)
      : callback(errMsg);

    img.crossOrigin = "anonymous";
    img.src = href;

    const reqHandle = {};
    reqHandle.abort = () => { img.src = ""; };

    return reqHandle;
  }

  return { request };
}

function initUrlFunc(endpoints) {
  if (!endpoints || !endpoints.length) fail("no valid tile endpoints!");

  // Use a different endpoint for each request
  var index = 0;

  return function(z, x, y) {
    index = (index + 1) % endpoints.length;
    var endpoint = endpoints[index];
    return endpoint.replace(/{z}/, z).replace(/{x}/, x).replace(/{y}/, y);
  };
}

function fail(message) {
  throw Error("ERROR in raster-source: " + message);
}
