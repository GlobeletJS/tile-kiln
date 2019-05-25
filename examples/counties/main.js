'use strict';

import * as tilekiln from "../../dist/tilekiln.bundle.js";

export function main() {
  var dataHref = "topoquantize_to_geo.json";

  var map = tilekiln.init('map', dataHref, 'geojson');
}
