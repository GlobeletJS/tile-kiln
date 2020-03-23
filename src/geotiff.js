import GeoTIFF from 'geotiff';

export function initGeotiffSource(source) {
  const getURL = initUrlFunc(source.tiles);

  function request({z, x, y, callback}) {
    var z_gdal, x_gdal, y_gdal;
    var zoomOverMax = 0; //Difference between maxzoom and current zoom when zoom>max;
    var cropSize = 512; //Crop parameters for when zoom>maxzoom
    var xIndex = 0; //Crop parameters for when zoom>maxzoom 
    var yIndex = 0; //Crop parameters for when zoom>maxzoom 
    
    if(z>source.maxzoom)
    {
      console.log("z is greater than maxzoom");
      zoomOverMax = z-source.maxzoom;
      //z_gdal=1;//!!!Need tochange this to 0 after regenerating gdal tiles without the pyramidOnly option
      z_gdal=0;
      x_gdal=Math.floor(y/Math.pow(2, zoomOverMax))+1;
      y_gdal=Math.floor(x/Math.pow(2, zoomOverMax))+1;
      console.log("Requested z/x/y: "+z+"/"+x+"/"+y);
      console.log("Fetching z/x/y: "+source.maxzoom+"/"+(y_gdal-1)+"/"+(x_gdal-1));
      
      //Compute crop parameters
      cropSize = 512/Math.pow(2, zoomOverMax);
      xIndex = (x%(Math.pow(2, zoomOverMax)))*cropSize;
      yIndex = (y%(Math.pow(2, zoomOverMax)))*cropSize;
      console.log("zoomOverMax:"+zoomOverMax+", xIndex:"+xIndex+", yIndex:"+yIndex+", cropSize:"+cropSize);
    }else{
      //z_gdal = source.maxzoom-z+1;///change to source.maxzoom-z after regenerating gdal tiles without the pyramidOnly option
      z_gdal = source.maxzoom-z;
      x_gdal = y+1;
      y_gdal = x+1;
    }
    //To-do: This is specific to the quarter globe tiles!!!
    if (z>4 & z<8 & x_gdal<10){x_gdal = "0"+x_gdal;}
    if (z>4 & z<8 & y_gdal<10){y_gdal = "0"+y_gdal;}
    if (z>7 & x_gdal<10){x_gdal = "00"+x_gdal;}
    if (z>7 & y_gdal<10){y_gdal = "00"+y_gdal;}
    if (z>7 & x_gdal>9 & x_gdal<100){x_gdal = "0"+x_gdal;}
    if (z>7 & y_gdal>9 & y_gdal<100){y_gdal = "0"+y_gdal;}
    console.log("z_gdal/x_gdal/y_gdal: "+z_gdal+"/"+x_gdal+"/"+y_gdal);
    const href = getURL(z_gdal, x_gdal, y_gdal);
    const errMsg = "ERROR in loadImage for href " + href;
   
    var tileValues=[];
    var cropRatio=512/cropSize;
    var croppedTileValues=[];
    var stretchedTileValues=[];
    var ind = 0;
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
        if(z>source.maxzoom){
          let k=0;
          for(let i=yIndex; i<(yIndex+cropSize); i++){
            for(let j=xIndex; j<(xIndex+cropSize); j++){
              croppedTileValues[k]=tileValues[(i*512)+j];
              k++;
            }
          }
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

    //return tileValues;
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
