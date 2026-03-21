/**
 * Fleet Map — Coordinate Projection
 * Converts between geographic (lat/lon) and screen (x/y) coordinates.
 * Uses equirectangular projection suitable for regional maps.
 */

export function proj(lat, lon, bounds, w, h) {
  // lon -> x: linear scale across width
  // lat -> y: inverted (north = top)
  var x = ((lon - bounds.lonW) / (bounds.lonE - bounds.lonW)) * w;
  var y = ((bounds.latN - lat) / (bounds.latN - bounds.latS)) * h;
  return { x: x, y: y };
}

export function invProj(x, y, bounds, w, h) {
  var lon = bounds.lonW + (x / w) * (bounds.lonE - bounds.lonW);
  var lat = bounds.latN - (y / h) * (bounds.latN - bounds.latS);
  return { lat: lat, lon: lon };
}
