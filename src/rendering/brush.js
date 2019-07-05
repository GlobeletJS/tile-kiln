import * as d3 from 'd3-geo';
import { buildStyleFunc } from "./styleFunction.js";

// Renders layers made of points, lines, polygons (like painting with a brush)
export function initBrush(ctx) {
  // Input ctx is a Canvas 2D rendering context

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  const path = d3.geoPath(null, ctx);
  const setRadius = (radius) => { if (radius) path.pointRadius(radius); };

  return function(style, zoom, data) {
    var layout = style.layout;
    var paint = style.paint;
    var method;

    const dataDependencies = [];

    // Set rendering context state based on values specified in the style.
    // For data-dependent styles, store the state FUNCTIONS in dataDependencies
    switch (style.type) {
      case "circle":
        setState("", paint["circle-radius"], setRadius);
        setState("fillStyle", paint["circle-color"]);
        setState("globalAlpha", paint["circle-opacity"]);
        method = "fill";
        break;

      case "line":
        if (layout) {
          setState("lineCap", layout["line-cap"]);
          setState("lineJoin", layout["line-join"]);
          setState("miterLimit", layout["line-miter-limit"]);
          // Missing line-round-limit
        }
        setState("lineWidth", paint["line-width"]);
        setState("globalAlpha", paint["line-opacity"]);
        setState("strokeStyle", paint["line-color"]);
        // Missing line-gap-width, line-translate, line-translate-anchor,
        //  line-offset, line-blur, line-gradient, line-pattern, line-dasharray
        method = "stroke";
        break;

      case "fill":
        setState("fillStyle", paint["fill-color"]);
        setState("globalAlpha", paint["fill-opacity"]);
        // Missing fill-outline-color, fill-translate, fill-translate-anchor,
        //  fill-pattern
        method = "fill";
        break;

      default:
        // Missing fill-extrusion, heatmap, hillshade
        return console.log("ERROR in brush.draw: layer.type = " +
            style.type + " not supported!");
    }

    // Draw the features in the data
    draw(data, dataDependencies, zoom, method);
    return;

    function setState(option, val, stateFunc) { // Nested for access to zoom
      if (!stateFunc) stateFunc = (val) => { ctx[option] = val; };

      let styleFunc = buildStyleFunc(val);
      if (styleFunc.type !== "property") return stateFunc(styleFunc(zoom));

      dataDependencies.push({ styleFunc, stateFunc });
    }
  }

  function draw(data, dataDependencies, zoom, method) {
    if (dataDependencies.length == 0) return drawPath(data, method);

    //sortAndDraw(data, dataDependencies, zoom, method);
    data.features.forEach(feature => {
      dataDependencies.forEach( dep => {
        dep.stateFunc( dep.styleFunc(zoom, feature) )
      });
      drawPath(feature, method);
    });
  }

  function drawPath(data, method) {
    ctx.beginPath();
    path(data);
    ctx[method]();
  }

  function sortAndDraw(data, dataDependencies, zoom, method) {
    //let t1, t2;
    //t1 = performance.now();

    // Build an array of the styles for each feature, with a sortable id
    let featureStyles = data.features.map( feature => {
      let vals = dataDependencies.map( dep => dep.styleFunc(zoom, feature) );
      let id = vals.join("");
      return { id, vals };
    });

    // Get a list of the unique styles
    let uniqStyles = featureStyles.slice()
      .sort( (a, b) => (a.id < b.id) ? -1 : 1 )  // Sort by .id
      .filter( (x, i, a) => !i || x.id !== a[i-1].id ); // Drop repeat values

    //console.log("Shortened from " + featureStyles.length + " to " + uniqStyles.length);

    //t2 = performance.now();
    //console.log("sortAndDraw: listing time = " + Math.round(t2 - t1) + "ms");
    //t1 = t2;

    // Gather the data for each style
    uniqStyles.forEach( style => {
      let subset = data.features.filter( (feature, index) => {
        return (featureStyles[index].id === style.id);
      });
      //style.data = { type: "FeatureCollection", features: subset };
      let newData = { type: "FeatureCollection", features: subset };
    //});

    //t2 = performance.now();
    //console.log("sortAndDraw: sorting time = " + Math.round(t2 - t1) + "ms");
    //t1 = t2;

    // Render the features for each unique style
    //uniqStyles.forEach(style => {
      // Set the data-dependent states for this style
      dataDependencies.forEach( (dep, index) => {
        dep.stateFunc(style.vals[index]);
      });
      //drawPath(style.data, method);
      drawPath(newData, method);
    });

    //t2 = performance.now();
    //console.log("sortAndDraw: drawing time = " + Math.round(t2 - t1) + "ms");
  }
}
