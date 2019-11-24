export function mergeMacrostrat(layer) {
  // Make sure this is really Macrostrat data
  let testProps = layer.features[0].properties;
  let isMacrostrat = testProps["map_id"] !== undefined &&
    testProps["legend_id"] !== undefined;
  if (!isMacrostrat) return layer;

  // Sort the polygons
  const polys = layer.features.map( feature => {
    delete feature.properties["map_id"];
    feature.id = feature.properties["legend_id"];
    return feature;
  }).sort( (a, b) => (a.id < b.id) ? -1 : 1 );

  // Combine polygons with the same .id
  const multiPolys = [];
  let numPolys = polys.length;
  let i = 0;
  while (i < numPolys) {
    let id = polys[i].id;

    // Set the properties for this .id
    let feature = {
      type: "Feature",
      properties: polys[i].properties,
      id: id,
    };

    // Collect the geometries of all polygons with this .id
    let coords = [];
    while (i < numPolys && polys[i].id === id) {
      let geom = polys[i].geometry;
      if (geom.type === "Polygon") {
        coords.push(geom.coordinates);
      } else if (geom.type === "MultiPolygon") {
        geom.coordinates.forEach( coord => coords.push(coord) );
      }
      i++;
    }

    // Append the combined geometry to the current feature
    feature.geometry = { type: "MultiPolygon", coordinates: coords };

    // Append this feature to the new feature set
    multiPolys.push(feature);
  }

  const newCollection = {
    type: "FeatureCollection",
    features: multiPolys
  };

  return newCollection;
}
