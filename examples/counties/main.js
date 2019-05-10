'use strict';

import * as vectormap from "../../dist/vectormap.bundle.js";

export function main() {
  var dataHref = "topoquantize_to_geo.json";

  var map = vectormap.init('map', dataHref);
}
