import { parseCSSColor } from 'csscolorparser';

export function evalStyle(styleFunction, zoom) {
  // Quick exit if styleFunction is a constant or undefined
  if (typeof styleFunction !== "object") return styleFunction;

  const stops = styleFunction.stops;
  if (!stops || stops.length < 2 || stops[0].length !== 2) {
    console.log("evalStyle: styleFunction = " + JSON.stringify(styleFunction));
    console.log("ERROR in evalStyle: failed to understand styleFunction!");
    return;
  }

  // Find which stops the current zoom level falls between
  var numStops = stops.length;
  var iz = 0;
  while (iz < numStops && zoom > stops[iz][0]) iz++;

  // Quick exit if we are outside the stops
  if (iz === 0) return stops[0][1];
  if (iz === numStops) return stops[iz - 1][1];

  // Interpolate the values
  var base = styleFunction.base || 1;
  var t = interpFactor(base, stops[iz-1][0], zoom, stops[iz][0]);
  var lowVal = stops[iz - 1][1];

  var valType = typeof lowVal;

  if (valType === "number") return lowVal + t * (stops[iz][1] - lowVal);

  var color1 = (valType === "string")
    ? parseCSSColor(lowVal)
    : null;
  if (!color1) {
    console.log("evalStyle: styleFunction = " + JSON.stringify(styleFunction));
    console.log("ERROR in evalStyle: failed to understand stop values!");
    return;
  }
  var color2 = parseCSSColor(stops[iz][1]);
  return interpColor(color1, color2, t);
}

function interpFactor(base, x0, x, x1) {
  // Follows mapbox-gl-js, style-spec/function/index.js.
  // NOTE: https://github.com/mapbox/mapbox-gl-js/issues/2698 not addressed!
  const range = x1 - x0;
  const dx = x - x0;

  if (range === 0) {
    return 0;
  } else if (base === 1) {
    return dx / range;
  } else {
    return (Math.pow(base, dx) - 1) / (Math.pow(base, range) - 1);
  }
}

function interpColor(c0, c1, t) {
  // Inputs c0, c1 are 4-element RGBA arrays as returned by parseCSSColor
  let c = [];
  for (let i = 0; i < 4; i++) {
    c[i] = c0[i] + t * (c1[i] - c0[i]);
  }
  return "rgba(" +
    Math.round(c[0]) + ", " +
    Math.round(c[1]) + ", " + 
    Math.round(c[2]) + ", " +
    c[3] + ")";
}
