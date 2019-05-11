'use strict';

import * as vectormap from "../../dist/vectormap.bundle.js";

export function main() {
  var tileHref = "testTile.mvt";

  var map = vectormap.init('map', tileHref, 'mvt');
}
