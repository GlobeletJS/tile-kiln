import GeoTIFF from 'geotiff';

export function initGeotiffSource(source) {
  const getURL = initUrlFunc(source.tiles);

  function request({z, x, y, callback}) {
    var zoomOverMax = 0; //Difference between maxzoom and current zoom when zoom>max;
    var cropSize = 512; //Crop parameters for when zoom>maxzoom
    var xIndex = 0; //Crop parameters for when zoom>maxzoom 
    var yIndex = 0; //Crop parameters for when zoom>maxzoom 
    
    if(z>source.maxzoom)
    {
      //Determine the maxzoom tile that covers the requested tile
      console.log("z is greater than maxzoom");
      console.log("Requested z/x/y: "+z+"/"+x+"/"+y);
      zoomOverMax = z-source.maxzoom;
      z=source.maxzoom;
      x=Math.floor(x/Math.pow(2, zoomOverMax));
      y=Math.floor(y/Math.pow(2, zoomOverMax));
      console.log("Fetching z/x/y: "+z+"/"+x+"/"+y);
      
      //Compute crop parameters
      cropSize = 512/Math.pow(2, zoomOverMax);
      xIndex = (x%(Math.pow(2, zoomOverMax)))*cropSize;
      yIndex = (y%(Math.pow(2, zoomOverMax)))*cropSize;
      console.log("zoomOverMax:"+zoomOverMax+", xIndex:"+xIndex+", yIndex:"+yIndex+", cropSize:"+cropSize);
    }
    
    const href = getURL(z, x, y);
    const errMsg = "ERROR in loadImage for href " + href;
   
    var tileValues=[];
    var cropRatio=512/cropSize;
    var croppedTileValues=[];
    var stretchedTileValues=[];
    var ind = 0;
    var t0, t1;

    //Fetch geotiff tile
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
        if(z>source.maxzoom){
          //Crop the maxzoom tile to the zoomed-in area
          let k=0;
          for(let i=yIndex; i<(yIndex+cropSize); i++){
            for(let j=xIndex; j<(xIndex+cropSize); j++){
              croppedTileValues[k]=tileValues[(i*512)+j];
              k++;
            }
          }
          //Stretch cropped tile to 512x512 pixels
          for(let l=0; l<croppedTileValues.length; l++){
            ind = (cropRatio*(l%cropSize))+(cropRatio*512*Math.floor(l/cropSize));
            for(let m=0; m<cropRatio; m++){
              for (let n=0; n<cropRatio; n++){
                stretchedTileValues[ind+((m*512)+n)]=croppedTileValues[l];
              }
            }
          }
          callback(null, stretchedTileValues);
        }else{
          callback(null, tileValues);
        }
      })
      .catch(errMsg => callback(errMsg));

    const reqHandle = {};
    reqHandle.abort = () => { };
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
  throw Error("ERROR in geotiff-source: " + message);
}
