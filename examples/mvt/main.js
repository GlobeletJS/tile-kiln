'use strict';

import * as vectormap from "../../dist/vectormap.bundle.js";

export function main() {
  //var tileHref = "terrain-v2_streets-v7_7-29-53.mvt";
  var tileHref = "https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/7/29/53.mvt?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";
  //var styleHref = "streets-v8-style.json";
  var styleHref = "https://api.mapbox.com/styles/v1/mapbox/streets-v8?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA";

  var map = vectormap.init('map', tileHref, styleHref, 'mvt');
}
