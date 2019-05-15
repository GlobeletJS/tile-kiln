'use strict';

import * as vectormap from "../../dist/vectormap.bundle.js";

export function main() {
  var tileHref = "testStreets.mvt";
  var styleHref = "streetsStyle.json";

  var map = vectormap.init('map', tileHref, styleHref, 'mvt');
}
