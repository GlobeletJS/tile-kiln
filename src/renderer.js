import * as d3 from 'd3-geo';

export function initRenderer(ctx) {
  // Input ctx is a Canvas 2D rendering context
  // Input styleDoc is a Mapbox style document, following the specification at
  // https://docs.mapbox.com/mapbox-gl-js/style-spec/

  // Save the default styling
  ctx.save();

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  const path = d3.geoPath(null, ctx);

  const layerStyles = {};

  return {
    setStyles,
    drawMVT,
  };

  function setStyles(styleDoc) {
    // Index each layer's style by the layer name for easier access
    for (let layer of styleDoc.layers) {
      layerStyles[ layer["source-layer"] ] = layer;
      //console.log("Styles for layer " + layer["source-layer"] + ":");
      //console.log(layer);
    }
    return;
  }

  function drawMVT(tile) {
    const layers = tile.layers;
    for (let layer in layers) {
      // Convert this layer to GeoJSON
      console.log("Decoding layer " + layers[layer].name);
      var data = layerToGeoJSON( layers[layer] );
      //console.log("layer converted to GeoJSON = " + JSON.stringify(data));

      // Get the style for this layer
      var style = layerStyles[ layers[layer].name ];
      if (!style) {
        console.log("ERROR in drawMVT: No style found for layer " + 
            layers[layer].name);
        return;
      }

      // Draw the layer, using the associated styles
      draw(ctx, path, data, layerStyles[ layers[layer].name ]);
    }
    return;
  }
}

function layerToGeoJSON( layer ) {
  // Based on https://observablehq.com/@mbostock/d3-mapbox-vector-tiles
  if (!layer) return;
  const features = [];
  for (let i = 0; i < layer.length; ++i) {
    const feature = layer.feature(i).toGeoJSON(512);
    features.push(feature);
  }
  return {
    type: "FeatureCollection", 
    features: features,
  };
}

function draw(ctx, path, data, style) {
  console.log("In draw function. style:");
  console.log(style);

  // Reset context to default styles
  ctx.restore();
  // Set up the drawing path
  ctx.beginPath();

  // Apply styling
  let layout = style.layout;
  let paint  = style.paint;
  switch (style.type) {
    case "circle" :  // Point or MultiPoint geometry
      if (paint["circle-radius"]) path.pointRadius(paint["circle-radius"]);
      if (paint["circle-color"]) ctx.fillStyle = paint["circle-color"];
      path(data);
      ctx.fill();
      break;
    case "line" :    // LineString, MultiLineString, Polygon, or MultiPolygon
      if (layout["line-cap"]) ctx.lineCap = layout["line-cap"];
      if (layout["line-join"]) ctx.lineJoin = layout["line-join"];
      if (layout["line-miter-limit"]) ctx.miterLimit = layout["line-miter-limit"];
      if (paint["line-color"]) ctx.strokeStyle = paint["line-color"];
      if (paint["line-width"]) ctx.lineWidth = paint["line-width"];
      path(data);
      ctx.stroke();
      break;
    case "fill" :    // Polygon or MultiPolygon (maybe also linestrings?)
      if (paint["fill-color"]) ctx.fillStyle = paint["fill-color"];
      path(data);
      ctx.fill();
      break;
    default:
      console.log("ERROR: Unknown layer rendering type: " + style.type);
  }
  return;
}
