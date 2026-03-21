/**
 * Viking Village Fleet Map — Depth Layer
 * ========================================
 * Renders the ocean background: bathymetry gradient, fathom contour
 * lines, and the latitude/longitude grid.
 *
 * NJ continental shelf edge data replaces the Brazil version.
 * The shelf runs NE-SW roughly parallel to the coast, dropping
 * off sharply at Hudson Canyon.
 *
 * Static layer — only redraws on resize.
 * Canvas: fleetCanvasDepth (z-index: 1)
 */

// NJ continental shelf edge — points tracing the shelf break
// from northeast of Sandy Hook to south of Atlantic City.
// The shelf is wider off NJ (~100 miles) than most of the East Coast.
var SHELF = [
  [40.80, -72.50],
  [40.60, -72.40],
  [40.40, -72.50],
  [40.20, -72.60],
  [40.00, -72.50],  // Hudson Canyon area — shelf narrows
  [39.80, -72.60],
  [39.60, -72.80],
  [39.40, -73.00],
  [39.20, -73.20],
  [39.00, -73.40],
  [38.80, -73.50],
];

var FATHOM_LABELS = [
  { idx: 1,  offset: 0, text: '100 fm' },
  { idx: 4,  offset: 0, text: '500 fm' },   // Hudson Canyon
  { idx: 7,  offset: 1, text: '1000 fm' },
  { idx: 9,  offset: 2, text: '2000 fm' },
];

function latLabel(deg) {
  var abs = Math.abs(deg);
  var dir = deg >= 0 ? 'N' : 'S';
  return abs + '\u00B0' + dir;
}

function lonLabel(deg) {
  var abs = Math.abs(deg);
  var dir = deg >= 0 ? 'E' : 'W';
  return abs + '\u00B0' + dir;
}

/**
 * Draw the depth layer.
 *
 * @param {CanvasRenderingContext2D} ctx — canvas context
 * @param {CanvasManager} cm — canvas manager (provides w, h, proj)
 * @param {object} config — merged FleetMap config
 */
export function drawDepth(ctx, cm, config) {
  var w = cm.w;
  var h = cm.h;
  var projFn = cm.proj.bind(cm);
  var colors = config.colors;
  var fonts  = config.fonts;
  var bounds = config.bounds;
  var t = cm.t || 0;

  // 1. Clear canvas with deep ocean color
  ctx.fillStyle = colors.deep;
  ctx.fillRect(0, 0, w, h);

  // 2. Radial ocean gradient
  var cx = w * 0.55;  // Offset east since ocean fills more of the map
  var cy = h * 0.5;
  var maxR = Math.sqrt(w * w + h * h) * 0.6;
  var oceanStops = colors.ocean;

  var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0.0, oceanStops[0]);
  grad.addColorStop(0.5, oceanStops[1]);
  grad.addColorStop(1.0, oceanStops[2]);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 3. Lat/Lon grid — every 1 degree (closer zoom than Brazil version)
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 8]);

  var lat, lon, p1, p2;

  // Latitude lines (horizontal) — every 1 degree
  var latStart = Math.ceil(bounds.latS);
  var latEnd   = Math.floor(bounds.latN);
  for (lat = latStart; lat <= latEnd; lat += 1) {
    p1 = projFn(lat, bounds.lonW);
    p2 = projFn(lat, bounds.lonE);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Longitude lines (vertical) — every 1 degree
  var lonStart = Math.ceil(bounds.lonW);
  var lonEnd   = Math.floor(bounds.lonE);
  for (lon = lonStart; lon <= lonEnd; lon += 1) {
    p1 = projFn(bounds.latN, lon);
    p2 = projFn(bounds.latS, lon);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Grid labels
  var fontSize = Math.max(9, Math.round(w * 0.009));
  ctx.font      = fontSize + 'px ' + fonts.sans;
  ctx.fillStyle = colors.grid;
  ctx.textBaseline = 'top';

  // Latitude labels (left edge)
  ctx.textAlign = 'left';
  for (lat = latStart; lat <= latEnd; lat += 1) {
    var pLabel = projFn(lat, bounds.lonW);
    ctx.fillText(latLabel(lat), 6, pLabel.y + 3);
  }

  // Longitude labels (bottom edge)
  ctx.textBaseline = 'bottom';
  ctx.textAlign    = 'center';
  for (lon = lonStart; lon <= lonEnd; lon += 1) {
    var pLonLabel = projFn(bounds.latS, lon);
    ctx.fillText(lonLabel(lon), pLonLabel.x, h - 4);
  }

  // 4. Depth contour lines (continental shelf)
  ctx.strokeStyle = colors.fathom;
  ctx.lineWidth   = 1;

  for (var c = 0; c < 3; c++) {
    var offset = c * 0.8; // degrees offshore (tighter than Brazil)

    ctx.beginPath();

    for (var i = 0; i < SHELF.length; i++) {
      var sLat = SHELF[i][0];
      var sLon = SHELF[i][1] - offset;

      var wave = Math.sin(t * 0.6 + i * 0.9 + c * 1.2) * 0.08;
      sLat += wave;
      sLon += wave * 0.3;

      var sp = projFn(sLat, sLon);

      if (i === 0) {
        ctx.moveTo(sp.x, sp.y);
      } else {
        var prev  = SHELF[i - 1];
        var pLat  = prev[0] + Math.sin(t * 0.6 + (i - 1) * 0.9 + c * 1.2) * 0.08;
        var pLon  = prev[1] - offset + Math.sin(t * 0.6 + (i - 1) * 0.9 + c * 1.2) * 0.08 * 0.3;
        var pp    = projFn(pLat, pLon);
        var cpx   = (pp.x + sp.x) * 0.5;
        var cpy   = (pp.y + sp.y) * 0.5;
        ctx.quadraticCurveTo(pp.x, pp.y, cpx, cpy);
      }
    }

    var last = SHELF[SHELF.length - 1];
    var lastWave = Math.sin(t * 0.6 + (SHELF.length - 1) * 0.9 + c * 1.2) * 0.08;
    var lastP = projFn(last[0] + lastWave, last[1] - offset + lastWave * 0.3);
    ctx.lineTo(lastP.x, lastP.y);

    ctx.stroke();
  }

  // Fathom labels
  var fathomFontSize = Math.max(8, Math.round(w * 0.008));
  ctx.font      = fathomFontSize + 'px ' + fonts.sans;
  ctx.fillStyle = colors.fathom;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (var f = 0; f < FATHOM_LABELS.length; f++) {
    var fl    = FATHOM_LABELS[f];
    var si    = fl.idx;
    var so    = fl.offset * 0.8;
    var sWave = Math.sin(t * 0.6 + si * 0.9 + fl.offset * 1.2) * 0.08;
    var fp    = projFn(
      SHELF[si][0] + sWave - 0.3,
      SHELF[si][1] - so + sWave * 0.3
    );
    ctx.fillText(fl.text, fp.x, fp.y);
  }
}
