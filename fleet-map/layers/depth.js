/**
 * Fleet Map — Depth Layer
 * ========================
 * Renders the ocean background: multi-band bathymetry gradient,
 * continental shelf contours, lat/lon grid, and depth zone coloring
 * that creates a satellite-imagery feel.
 *
 * This is a STATIC layer — only redraws on resize.
 * Canvas: fleetCanvasDepth (z-index: 1, bottom layer)
 */

// Continental shelf edge — ~14 points tracing the shelf break
var SHELF = [
  [-15.0, -37.5],
  [-16.5, -37.0],
  [-18.0, -37.5],
  [-19.5, -38.5],
  [-21.0, -39.5],
  [-22.0, -40.0],
  [-23.0, -41.0],
  [-24.0, -42.0],
  [-25.5, -43.5],
  [-27.0, -45.0],
  [-28.5, -46.0],
  [-30.0, -47.5],
  [-32.0, -49.0],
  [-34.0, -50.5],
];

// Fathom labels at selected contour indices
var FATHOM_LABELS = [
  { idx: 2,  offset: 0, text: '100 fm' },
  { idx: 6,  offset: 1, text: '500 fm' },
  { idx: 10, offset: 2, text: '1000 fm' },
  { idx: 12, offset: 2, text: '2000 fm' },
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
 * Supports two call signatures:
 *   drawDepth(ctx, cm, config)                    — CanvasManager style
 *   drawDepth(ctx, w, h, projFn, config, t)       — explicit style
 */
export function drawDepth(ctx, cmOrW, configOrH, projFnArg, configArg, tArg) {
  var w, h, projFn, config, t;

  if (typeof cmOrW === 'object' && cmOrW.w !== undefined) {
    w = cmOrW.w;
    h = cmOrW.h;
    projFn = cmOrW.proj.bind(cmOrW);
    config = configOrH;
    t = 0;
  } else {
    w = cmOrW;
    h = configOrH;
    projFn = projFnArg;
    config = configArg;
    t = tArg || 0;
  }

  var colors = config.colors;
  var fonts  = config.fonts;
  var bounds = config.bounds;

  // ------------------------------------------------------------------
  // 1. Clear canvas with deepest ocean
  // ------------------------------------------------------------------
  ctx.fillStyle = colors.deep;
  ctx.fillRect(0, 0, w, h);

  // ------------------------------------------------------------------
  // 2. Multi-band ocean gradient — satellite bathymetry feel
  //    Multiple radial gradients layered for depth variation
  // ------------------------------------------------------------------
  var cx = w * 0.5;
  var cy = h * 0.5;
  var maxR = Math.sqrt(cx * cx + cy * cy);
  var oceanStops = colors.ocean;

  // Base ocean gradient
  var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0.0, oceanStops[0]);
  grad.addColorStop(0.5, oceanStops[1]);
  grad.addColorStop(1.0, oceanStops[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Deep ocean trench zone — darker band across the mid-Atlantic
  var trenchY = h * 0.42;
  var trenchGrad = ctx.createLinearGradient(0, trenchY - h * 0.15, 0, trenchY + h * 0.15);
  trenchGrad.addColorStop(0.0, 'rgba(2,6,14,0)');
  trenchGrad.addColorStop(0.3, 'rgba(2,6,14,0.08)');
  trenchGrad.addColorStop(0.5, 'rgba(2,6,14,0.12)');
  trenchGrad.addColorStop(0.7, 'rgba(2,6,14,0.08)');
  trenchGrad.addColorStop(1.0, 'rgba(2,6,14,0)');
  ctx.fillStyle = trenchGrad;
  ctx.fillRect(0, trenchY - h * 0.15, w, h * 0.3);

  // Shallow coastal shelf — warmer blue near the Brazilian coast
  var shelfGrad = ctx.createLinearGradient(w * 0.7, 0, w, 0);
  shelfGrad.addColorStop(0.0, 'rgba(12,35,55,0)');
  shelfGrad.addColorStop(0.5, 'rgba(12,40,60,0.06)');
  shelfGrad.addColorStop(0.8, 'rgba(15,50,70,0.1)');
  shelfGrad.addColorStop(1.0, 'rgba(10,42,58,0.14)');
  ctx.fillStyle = shelfGrad;
  ctx.fillRect(w * 0.7, 0, w * 0.3, h);

  // Tropical warm band — subtle warmth in the equatorial zone
  var eqY = projFn(0, bounds.lonW).y;
  var tropicGrad = ctx.createLinearGradient(0, eqY - h * 0.1, 0, eqY + h * 0.1);
  tropicGrad.addColorStop(0.0, 'rgba(15,30,50,0)');
  tropicGrad.addColorStop(0.4, 'rgba(18,35,55,0.04)');
  tropicGrad.addColorStop(0.6, 'rgba(18,35,55,0.04)');
  tropicGrad.addColorStop(1.0, 'rgba(15,30,50,0)');
  ctx.fillStyle = tropicGrad;
  ctx.fillRect(0, eqY - h * 0.1, w, h * 0.2);

  // ------------------------------------------------------------------
  // 3. Lat/Lon grid — every 5 degrees
  // ------------------------------------------------------------------
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 8]);

  var lat, lon, p1, p2;

  var latStart = Math.ceil(bounds.latS / 5) * 5;
  var latEnd   = Math.floor(bounds.latN / 5) * 5;
  for (lat = latStart; lat <= latEnd; lat += 5) {
    p1 = projFn(lat, bounds.lonW);
    p2 = projFn(lat, bounds.lonE);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  var lonStart = Math.ceil(bounds.lonW / 5) * 5;
  var lonEnd   = Math.floor(bounds.lonE / 5) * 5;
  for (lon = lonStart; lon <= lonEnd; lon += 5) {
    p1 = projFn(bounds.latN, lon);
    p2 = projFn(bounds.latS, lon);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Equator highlight — slightly brighter line
  var eq1 = projFn(0, bounds.lonW);
  var eq2 = projFn(0, bounds.lonE);
  ctx.beginPath();
  ctx.moveTo(eq1.x, eq1.y);
  ctx.lineTo(eq2.x, eq2.y);
  ctx.strokeStyle = 'rgba(212,165,74,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tropics — faint lines at 23.5°N and 23.5°S
  ctx.strokeStyle = 'rgba(212,165,74,0.03)';
  ctx.setLineDash([2, 6]);
  var tN1 = projFn(23.5, bounds.lonW);
  var tN2 = projFn(23.5, bounds.lonE);
  ctx.beginPath();
  ctx.moveTo(tN1.x, tN1.y);
  ctx.lineTo(tN2.x, tN2.y);
  ctx.stroke();
  var tS1 = projFn(-23.5, bounds.lonW);
  var tS2 = projFn(-23.5, bounds.lonE);
  ctx.beginPath();
  ctx.moveTo(tS1.x, tS1.y);
  ctx.lineTo(tS2.x, tS2.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Grid labels
  var fontSize = Math.max(9, Math.round(w * 0.009));
  ctx.font      = fontSize + 'px ' + fonts.sans;
  ctx.fillStyle = colors.grid;
  ctx.textBaseline = 'top';

  ctx.textAlign = 'left';
  for (lat = latStart; lat <= latEnd; lat += 5) {
    var pLabel = projFn(lat, bounds.lonW);
    ctx.fillText(latLabel(lat), 6, pLabel.y + 3);
  }

  ctx.textBaseline = 'bottom';
  ctx.textAlign    = 'center';
  for (lon = lonStart; lon <= lonEnd; lon += 5) {
    var pLonLabel = projFn(bounds.latS, lon);
    ctx.fillText(lonLabel(lon), pLonLabel.x, h - 4);
  }

  // ------------------------------------------------------------------
  // 4. Depth contour lines (continental shelf)
  // ------------------------------------------------------------------
  ctx.strokeStyle = colors.fathom;
  ctx.lineWidth   = 1;

  for (var c = 0; c < 3; c++) {
    var offset = c * 1.5;

    ctx.beginPath();

    for (var i = 0; i < SHELF.length; i++) {
      var sLat = SHELF[i][0];
      var sLon = SHELF[i][1] - offset;

      var wave = Math.sin(t * 0.6 + i * 0.9 + c * 1.2) * 0.15;
      sLat += wave;
      sLon += wave * 0.5;

      var sp = projFn(sLat, sLon);

      if (i === 0) {
        ctx.moveTo(sp.x, sp.y);
      } else {
        var prev  = SHELF[i - 1];
        var pLat  = prev[0] + Math.sin(t * 0.6 + (i - 1) * 0.9 + c * 1.2) * 0.15;
        var pLon  = prev[1] - offset + Math.sin(t * 0.6 + (i - 1) * 0.9 + c * 1.2) * 0.15 * 0.5;
        var pp    = projFn(pLat, pLon);
        var cpx   = (pp.x + sp.x) * 0.5;
        var cpy   = (pp.y + sp.y) * 0.5;
        ctx.quadraticCurveTo(pp.x, pp.y, cpx, cpy);
      }
    }

    var last = SHELF[SHELF.length - 1];
    var lastWave = Math.sin(t * 0.6 + (SHELF.length - 1) * 0.9 + c * 1.2) * 0.15;
    var lastP = projFn(last[0] + lastWave, last[1] - offset + lastWave * 0.5);
    ctx.lineTo(lastP.x, lastP.y);

    ctx.stroke();
  }

  // Shelf zone fill — subtle tinted area between coast and first contour
  ctx.beginPath();
  for (i = 0; i < SHELF.length; i++) {
    sp = projFn(SHELF[i][0], SHELF[i][1]);
    if (i === 0) ctx.moveTo(sp.x, sp.y);
    else ctx.lineTo(sp.x, sp.y);
  }
  ctx.lineTo(w + 10, projFn(SHELF[SHELF.length - 1][0], SHELF[SHELF.length - 1][1]).y);
  ctx.lineTo(w + 10, projFn(SHELF[0][0], SHELF[0][1]).y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(15,55,70,0.05)';
  ctx.fill();

  // Fathom labels
  var fathomFontSize = Math.max(8, Math.round(w * 0.008));
  ctx.font      = fathomFontSize + 'px ' + fonts.sans;
  ctx.fillStyle = colors.fathom;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (var f = 0; f < FATHOM_LABELS.length; f++) {
    var fl    = FATHOM_LABELS[f];
    var si    = fl.idx;
    var so    = fl.offset * 1.5;
    var sWave = Math.sin(t * 0.6 + si * 0.9 + fl.offset * 1.2) * 0.15;
    var fp    = projFn(
      SHELF[si][0] + sWave - 0.6,
      SHELF[si][1] - so + sWave * 0.5
    );
    ctx.fillText(fl.text, fp.x, fp.y);
  }
}
