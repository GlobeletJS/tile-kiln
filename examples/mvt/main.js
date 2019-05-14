'use strict';

import * as vectormap from "../../dist/vectormap.bundle.js";

export function main() {
  var tileHref = "testSpots.mvt";
  var styleHref = "testStyle.json";

  var map = vectormap.init('map', tileHref, styleHref, 'mvt');
}
