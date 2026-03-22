/**
 * Viking Village Fleet Map — Coast Layer
 * ========================================
 * Renders the NJ coastline, land fill, labels, ports, shipping routes,
 * and a decorative cartouche.
 *
 * KEY DIFFERENCE from Brazil version:
 *   Land is on the LEFT (west side), ocean on the RIGHT (east).
 *   The land fill closes along the LEFT edge of the canvas.
 *
 * Canvas: fleetCanvasCoast (z-index: 3)
 */

/**
 * Build smooth coastline path using quadratic bezier curves.
 */
function traceCoast(ctx, coastData, projFn) {
  var pts = [];
  var i, p;
  for (i = 0; i < coastData.length; i++) {
    pts.push(projFn(coastData[i][0], coastData[i][1]));
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (i = 0; i < pts.length - 1; i++) {
    var mx = (pts[i].x + pts[i + 1].x) * 0.5;
    var my = (pts[i].y + pts[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }

  var last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);

  return { first: pts[0], last: last };
}

/**
 * Draw the coast layer.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasManager} cm — canvas manager
 * @param {Array}    coastData  — [[lat,lon], ...] coastline points
 * @param {Array}    ports      — [{ name, lat, lon, size }, ...]
 * @param {Array}    routes     — [{ name, points: [[lat,lon],...] }, ...]
 * @param {object}   config     — merged FleetMap config
 * @param {number}   t          — animation time counter
 */
export function drawCoast(ctx, cm, coastData, ports, routes, config, t) {
  var w = cm.w;
  var h = cm.h;
  var projFn = cm.proj.bind(cm);
  var colors = config.colors;
  var fonts  = config.fonts;

  // ------------------------------------------------------------------
  // 1. Land fill — coastline closed along LEFT edge (land is west)
  // ------------------------------------------------------------------
  var ends = traceCoast(ctx, coastData, projFn);

  // Close the path along the LEFT/bottom edge (land is west)
  ctx.lineTo(-10, ends.last.y);
  ctx.lineTo(-10, ends.first.y);
  ctx.closePath();

  // Linear gradient across the land mass (from left edge to coast)
  var landStops = colors.land;
  var landGrad  = ctx.createLinearGradient(0, 0, w * 0.25, 0);
  landGrad.addColorStop(0.0, landStops[2]);
  landGrad.addColorStop(0.5, landStops[1]);
  landGrad.addColorStop(1.0, landStops[0]);

  ctx.fillStyle = landGrad;
  ctx.fill();

  // ------------------------------------------------------------------
  // 2. Coast outline — double stroke
  // ------------------------------------------------------------------
  traceCoast(ctx, coastData, projFn);
  ctx.strokeStyle = colors.coastGlow;
  ctx.lineWidth   = 6;
  ctx.stroke();

  traceCoast(ctx, coastData, projFn);
  ctx.strokeStyle = colors.coastLine;
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // ------------------------------------------------------------------
  // 3. Barnegat Inlet highlight — small break/glow at the inlet
  // ------------------------------------------------------------------
  var inletN = projFn(39.775, -74.10);
  var inletS = projFn(39.765, -74.106);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(inletN.x, inletN.y);
  ctx.lineTo(inletS.x, inletS.y);
  ctx.strokeStyle = colors.ouro;  // Lighthouse red
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inlet label
  var inletMid = projFn(39.77, -74.08);
  ctx.font = Math.max(7, Math.round(w * 0.007)) + 'px ' + fonts.sans;
  ctx.fillStyle = colors.ouro;
  ctx.globalAlpha = 0.35;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BARNEGAT INLET', inletMid.x + 4, inletMid.y);
  ctx.restore();

  // ------------------------------------------------------------------
  // 4. Land labels
  // ------------------------------------------------------------------
  var labelSize = Math.max(14, Math.round(w * 0.022));

  // "N E W   J E R S E Y"
  ctx.save();
  var njPt = projFn(39.8, -74.25);
  ctx.translate(njPt.x, njPt.y);
  ctx.rotate(-1.4);  // Nearly vertical, following the coast
  ctx.font         = labelSize + 'px ' + fonts.display;
  ctx.fillStyle    = colors.coastLine;
  ctx.globalAlpha  = 0.25;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N E W   J E R S E Y', 0, 0);
  ctx.restore();

  // "A T L A N T I C   O C E A N"
  ctx.save();
  var aoPos = projFn(39.5, -72.5);
  ctx.translate(aoPos.x, aoPos.y);
  ctx.rotate(-0.05);
  ctx.font         = Math.round(labelSize * 0.75) + 'px ' + fonts.sans;
  ctx.fillStyle    = colors.blade;
  ctx.globalAlpha  = 0.06;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A T L A N T I C   O C E A N', 0, 0);
  ctx.restore();

  // "LONG BEACH ISLAND" — small label along LBI
  ctx.save();
  var lbiPt = projFn(39.60, -74.15);
  ctx.translate(lbiPt.x, lbiPt.y);
  ctx.rotate(-1.3);
  ctx.font         = Math.max(8, Math.round(w * 0.008)) + 'px ' + fonts.sans;
  ctx.fillStyle    = colors.creme;
  ctx.globalAlpha  = 0.2;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L O N G   B E A C H   I S L A N D', 0, 0);
  ctx.restore();

  // "HUDSON CANYON" label at the canyon
  ctx.save();
  var hcPt = projFn(39.95, -72.1);
  ctx.translate(hcPt.x, hcPt.y);
  ctx.rotate(-0.3);
  ctx.font         = Math.max(9, Math.round(w * 0.009)) + 'px ' + fonts.sans;
  ctx.fillStyle    = colors.blade;
  ctx.globalAlpha  = 0.15;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HUDSON CANYON', 0, 0);
  ctx.restore();

  ctx.globalAlpha = 1;

  // ------------------------------------------------------------------
  // 5. Fishing ground labels
  // ------------------------------------------------------------------
  var groundFont = Math.max(7, Math.round(w * 0.007));

  var fishingGrounds = [
    { name: 'BARNEGAT RIDGE', lat: 39.76, lon: -74.00 },
    { name: 'NORTH RIDGE', lat: 39.70, lon: -73.81 },
    { name: 'SOUTH RIDGE', lat: 39.65, lon: -73.79 },
    { name: 'HARVEY CEDARS LUMP', lat: 39.67, lon: -74.06 },
    { name: '17 FATHOM HOLE', lat: 40.37, lon: -73.82 },
    { name: 'KLONDIKE', lat: 40.15, lon: -73.91 },
    { name: 'BARNEGAT LIGHT REEF', lat: 39.75, lon: -74.02 },
  ];

  ctx.save();
  ctx.font = groundFont + 'px ' + fonts.sans;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (var gi = 0; gi < fishingGrounds.length; gi++) {
    var gnd = fishingGrounds[gi];
    var gp = projFn(gnd.lat, gnd.lon);
    ctx.fillStyle = colors.blade;
    ctx.globalAlpha = 0.12;
    ctx.fillText(gnd.name, gp.x, gp.y);

    // Small cross marker
    ctx.beginPath();
    ctx.moveTo(gp.x - 3, gp.y + 6);
    ctx.lineTo(gp.x + 3, gp.y + 6);
    ctx.moveTo(gp.x, gp.y + 3);
    ctx.lineTo(gp.x, gp.y + 9);
    ctx.strokeStyle = colors.blade;
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();

  // ------------------------------------------------------------------
  // 6. Shipping routes — animated dashed lines
  // ------------------------------------------------------------------
  if (routes && routes.length) {
    ctx.save();
    ctx.setLineDash([6, 10]);
    ctx.lineWidth = 1;

    for (var r = 0; r < routes.length; r++) {
      var route = routes[r];
      var rPts  = route.points;
      if (!rPts || rPts.length < 2) continue;

      ctx.strokeStyle  = colors.blade;
      ctx.globalAlpha  = 0.2;
      ctx.lineDashOffset = -t * 30;

      ctx.beginPath();
      var rp0 = projFn(rPts[0][0], rPts[0][1]);
      ctx.moveTo(rp0.x, rp0.y);
      for (var ri = 1; ri < rPts.length; ri++) {
        var rp = projFn(rPts[ri][0], rPts[ri][1]);
        ctx.lineTo(rp.x, rp.y);
      }
      ctx.stroke();

      var labelIdx = Math.min(2, rPts.length - 1);
      var rlp      = projFn(rPts[labelIdx][0], rPts[labelIdx][1]);
      ctx.font      = Math.max(9, Math.round(w * 0.009)) + 'px ' + fonts.sans;
      ctx.fillStyle = colors.blade;
      ctx.globalAlpha = 0.25;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2192 ' + route.name, rlp.x + 6, rlp.y);
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // 7. Ports
  // ------------------------------------------------------------------
  if (ports && ports.length) {
    var portFontSize = Math.max(9, Math.round(w * 0.009));

    for (var pi = 0; pi < ports.length; pi++) {
      var port   = ports[pi];
      var pp     = projFn(port.lat, port.lon);
      var major  = port.size === 'major';
      var radius = major ? 5 : 3;

      // Pulse ring for major ports
      if (major) {
        var pulse = Math.sin(t * 2.5) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, radius + 4 + pulse * 6, 0, Math.PI * 2);
        ctx.strokeStyle = colors.verde;
        ctx.globalAlpha = 0.15 * (1 - pulse);
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      // Port dot
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, radius, 0, Math.PI * 2);
      ctx.fillStyle   = colors.verde;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // Port label
      ctx.font         = portFontSize + 'px ' + fonts.sans;
      ctx.fillStyle    = colors.verde;
      ctx.globalAlpha  = 0.65;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(port.name.toUpperCase(), pp.x + radius + 5, pp.y);
    }

    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------
  // 8. Cartouche — decorative title frame (top-left corner)
  // ------------------------------------------------------------------
  if (config.title) {
    ctx.save();

    var cx  = 24;
    var cy  = 24;
    var cw  = Math.min(280, w * 0.3);
    var ch  = config.subtitle ? 72 : 48;
    var pad = 14;

    ctx.globalAlpha = 0.5;

    // Outer border — lighthouse red
    ctx.strokeStyle = colors.ouro;
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    // Inner border
    ctx.lineWidth = 0.5;
    ctx.strokeRect(cx + 4, cy + 4, cw - 8, ch - 8);

    // Corner ornaments
    var tickLen = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy + tickLen);       ctx.lineTo(cx, cy);       ctx.lineTo(cx + tickLen, cy);
    ctx.moveTo(cx + cw - tickLen, cy);  ctx.lineTo(cx + cw, cy);  ctx.lineTo(cx + cw, cy + tickLen);
    ctx.moveTo(cx, cy + ch - tickLen);  ctx.lineTo(cx, cy + ch);  ctx.lineTo(cx + tickLen, cy + ch);
    ctx.moveTo(cx + cw - tickLen, cy + ch); ctx.lineTo(cx + cw, cy + ch); ctx.lineTo(cx + cw, cy + ch - tickLen);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Title text
    var titleSize = Math.max(13, Math.round(cw * 0.07));
    ctx.font         = titleSize + 'px ' + fonts.display;
    ctx.fillStyle    = colors.ouro;
    ctx.globalAlpha  = 0.6;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.title, cx + pad, cy + pad);

    // Subtitle
    if (config.subtitle) {
      var subSize = Math.max(9, Math.round(titleSize * 0.65));
      ctx.font        = subSize + 'px ' + fonts.sans;
      ctx.globalAlpha = 0.4;
      ctx.fillText(config.subtitle, cx + pad, cy + pad + titleSize + 6);
    }

    ctx.restore();
  }
}
