'use strict';

import * as vectormap from "../../dist/vectormap.bundle.js";

export function main() {
  var tileHref = "testStreets.mvt";
  var styleHref = "streets-v8-style.json";

  var map = vectormap.init('map', tileHref, styleHref, 'mvt');
}
