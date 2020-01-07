import GeoTIFF from 'geotiff';

export function loadGeotiff(href, callback) {
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
