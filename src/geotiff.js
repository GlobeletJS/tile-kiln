import GeoTIFF from 'geotiff';

export function initGeotiffSource(source) {
  const getURL = initUrlFunc(source.tiles);

  function request({z, x, y, callback}) {
    var z_gdal = source.maxzoom-z;
    var x_gdal = y+1;
    var y_gdal = x+1;
    if (z>3 & x_gdal<10){x_gdal = "0"+x_gdal;}
    if (z>3 & y_gdal<10){y_gdal = "0"+y_gdal;}
    const href = getURL(z_gdal, x_gdal, y_gdal);
    console.log(href);
    const errMsg = "ERROR in loadImage for href " + href;
   
    var tileValues=[];
    var t0, t1;
    GeoTIFF.fromUrl(href)
      .then( tiff => {
        t0 = performance.now();
        return tiff.getImage();
      })
      .then( tileImage => tileImage.readRasters() )
      .then( tileReadRasters => {
        tileValues=tileReadRasters[0];
        t1 = performance.now();
        let time = (t1 - t0).toFixed(3) + "ms";
        console.log("loadGeoTiff: time = " + time);
        callback(null, tileValues);
      })
      .catch(err => callback(err));

    return tileValues;
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
  throw Error("ERROR in geotiff-source: " + message);
}
