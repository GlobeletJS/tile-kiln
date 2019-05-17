export function initFeatureGetter(size, sx, sy) {
  // This closure just saves the size, sx, sy parameters

  function getFeatures(layer, filterObj) {
    // Based on https://observablehq.com/@mbostock/d3-mapbox-vector-tiles
    if (!layer) return;
    var filter = prepFilter(filterObj);

    const features = [];
    for (let i = 0; i < layer.length; ++i) {
      const feature = layer.feature(i).toGeoJSON(size, sx, sy);
      if (filter(feature)) features.push(feature);
    }

    return (features.length < 1)
      ? false
      : { type: "FeatureCollection", features: features };
  }

  return getFeatures;
}

function prepFilter(filterObj) {
  // filterObj is a filter definition following the "deprecated" syntax:
  // https://docs.mapbox.com/mapbox-gl-js/style-spec/#other-filter
  if (!filterObj) return () => true;

  var type, key, vals;

  // If this is a combined filter, the vals are themselves filter definitions
  [type, ...vals] = filterObj;
  switch (type) {
    case "all": {
      let filters = vals.map(prepFilter);  // WARNING: Iteratively recursive!
      return (d) => filters.every( filt => filt(d) );
    }
    case "any": {
      let filters = vals.map(prepFilter);
      return (d) => filters.some( filt => filt(d) );
    }
    case "none": {
      let filters = vals.map(prepFilter);
      return (d) => filters.every( filt => !filt(d) );
    }
    default: break; // Must be a simple filter
  }

  [type, key, ...vals] = filterObj;
  var getVal = initFeatureValGetter(key);

  switch (type) {
    // Existential Filters
    case "has": 
      return d => !!getVal(d); // !! forces a Boolean return
    case "!has": 
      return d => !getVal(d);

    // Comparison Filters
    case "==": 
      return d => getVal(d) === vals[0];
    case "!=":
      return d => getVal(d) !== vals[0];
    case ">":
      return d => getVal(d) > vals[0];
    case ">=":
      return d => getVal(d) >= vals[0];
    case "<":
      return d => getVal(d) < vals[0];
    case "<=":
      return d => getVal(d) <= vals[0];

    // Set Membership Filters
    case "in" :
      return d => vals.includes( getVal(d) );
    case "!in" :
      return d => !vals.includes( getVal(d) );
    default:
      console.log("prepFilter: unknown filter type = " + filterString[0]);
  }
  // No recognizable filter criteria. Return a filter that is always true
  return () => true;
}

function initFeatureValGetter(key) {
  switch (key) {
    case "$type":
      // TODO: data includes MultiLineString, MultiPolygon, etc-NOT IN SPEC
      return f => f.geometry.type;
    case "$id":
      return f => f.id;
    default:
      return f => f.properties[key];
  }
}
