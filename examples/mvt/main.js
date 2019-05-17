'use strict';

import * as vectormap from "../../dist/vectormap.bundle.js";

export function main() {
  //var tileHref = "testStreets.mvt";
  var tileHref = "terrain-v2_streets-v7_7-29-53.mvt";
  var styleHref = "streets-v8-style.json";

  var map = vectormap.init('map', tileHref, styleHref, 'mvt');
}
