'use strict';

import * as vectormap from "../../dist/vectormap.bundle.js";
import data from "./topoquantize_to_geo.json";

export function main() {
  console.log("data.type = " + data.type);

  var map = vectormap.init('map', data);
}
