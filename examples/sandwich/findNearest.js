export function findNearest(x, y, threshold, features) {
  var minDistance = Infinity;
  var minIndex = 0;

  features.forEach(checkDistance);

  function checkDistance(feature, index) {
    var p = feature.geometry.coordinates;
    var distance = Math.sqrt( (p[0] - x)**2 + (p[1] - y)**2 );
    if (distance < minDistance) {
      minDistance = distance;
      minIndex = index;
    }
  }

  return (minDistance <= threshold)
    ? features[minIndex]
    : {};
}
