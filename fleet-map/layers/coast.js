/**
 * Fleet Map — Coast Layer
 * ========================
 * Renders the coastline, land fill, labels, ports, shipping routes,
 * and a decorative cartouche.
 *
 * Supports asset design system: when an AssetRenderer is provided,
 * ports render as themed symbols with optional facility icons.
 *
 * Canvas: fleetCanvasCoast (z-index: 3)
 */

/**
 * Build the smooth coastline path using quadratic bezier curves.
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
 * @param {CanvasManager} cm
 * @param {Array} coastData
 * @param {Array} ports
 * @param {Array} routes
 * @param {object} config
 * @param {number} t
 * @param {AssetRenderer} [renderer] — optional asset renderer for themed ports
 */
export function drawCoast(ctx, cm, coastData, ports, routes, config, t, renderer) {
  var w = cm.w;
  var h = cm.h;
  var projFn = cm.proj.bind(cm);
  var colors = config.colors;
  var fonts  = config.fonts;
  var useAssets = renderer && config.assets && config.assets.showFacilities !== false;

  // ------------------------------------------------------------------
  // 1. Land fill
  // ------------------------------------------------------------------
  var ends = traceCoast(ctx, coastData, projFn);

  ctx.lineTo(w + 10, ends.last.y);
  ctx.lineTo(w + 10, ends.first.y);
  ctx.closePath();

  var landStops = colors.land;
  var landGrad  = ctx.createLinearGradient(w * 0.6, 0, w, 0);
  landGrad.addColorStop(0.0, landStops[0]);
  landGrad.addColorStop(0.5, landStops[1]);
  landGrad.addColorStop(1.0, landStops[2]);

  ctx.fillStyle = landGrad;
  ctx.fill();

  // ------------------------------------------------------------------
  // 2. Coast outline
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
  // 3. Land labels
  // ------------------------------------------------------------------
  var labelSize = Math.max(14, Math.round(w * 0.022));

  ctx.save();
  var bz = projFn(-18, -42);
  ctx.translate(bz.x, bz.y);
  ctx.rotate(-0.35);
  ctx.font         = labelSize + 'px ' + fonts.display;
  ctx.fillStyle    = colors.coastLine;
  ctx.globalAlpha  = 0.35;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B R A Z I L', 0, 0);
  ctx.restore();

  ctx.save();
  var sa = projFn(-28, -38);
  ctx.translate(sa.x, sa.y);
  ctx.rotate(-0.18);
  ctx.font         = Math.round(labelSize * 0.75) + 'px ' + fonts.sans;
  ctx.fillStyle    = colors.blade;
  ctx.globalAlpha  = 0.08;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S O U T H   A T L A N T I C', 0, 0);
  ctx.restore();

  ctx.globalAlpha = 1;

  // ------------------------------------------------------------------
  // 4. Shipping routes
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
  // 5. Ports — asset renderer or fallback
  // ------------------------------------------------------------------
  if (ports && ports.length) {
    if (useAssets) {
      // Themed port rendering via asset renderer
      for (var pi = 0; pi < ports.length; pi++) {
        var port = ports[pi];
        var pp = projFn(port.lat, port.lon);
        renderer.drawPort(ctx, port, pp.x, pp.y, {
          canvasWidth: w,
          t: t,
        });
      }
    } else {
      // Fallback: original port dot rendering
      var portFontSize = Math.max(9, Math.round(w * 0.009));

      for (var pi2 = 0; pi2 < ports.length; pi2++) {
        var port2  = ports[pi2];
        var pp2    = projFn(port2.lat, port2.lon);
        var major  = port2.size === 'major';
        var radius = major ? 5 : 3;

        if (major) {
          var pulse = Math.sin(t * 2.5) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(pp2.x, pp2.y, radius + 4 + pulse * 6, 0, Math.PI * 2);
          ctx.strokeStyle = colors.verde;
          ctx.globalAlpha = 0.15 * (1 - pulse);
          ctx.lineWidth   = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(pp2.x, pp2.y, radius, 0, Math.PI * 2);
        ctx.fillStyle   = colors.verde;
        ctx.globalAlpha = 0.85;
        ctx.fill();

        ctx.font         = portFontSize + 'px ' + fonts.sans;
        ctx.fillStyle    = colors.verde;
        ctx.globalAlpha  = 0.65;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(port2.name.toUpperCase(), pp2.x + radius + 5, pp2.y);
      }

      ctx.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------------
  // 6. Cartouche
  // ------------------------------------------------------------------
  if (config.title) {
    ctx.save();

    var cx  = 24;
    var cy  = 24;
    var cw  = Math.min(260, w * 0.28);
    var ch  = config.subtitle ? 68 : 48;
    var pad = 14;

    ctx.globalAlpha = 0.5;

    ctx.strokeStyle = colors.ouro;
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    ctx.lineWidth = 0.5;
    ctx.strokeRect(cx + 4, cy + 4, cw - 8, ch - 8);

    var tickLen = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy + tickLen);       ctx.lineTo(cx, cy);       ctx.lineTo(cx + tickLen, cy);
    ctx.moveTo(cx + cw - tickLen, cy);  ctx.lineTo(cx + cw, cy);  ctx.lineTo(cx + cw, cy + tickLen);
    ctx.moveTo(cx, cy + ch - tickLen);  ctx.lineTo(cx, cy + ch);  ctx.lineTo(cx + tickLen, cy + ch);
    ctx.moveTo(cx + cw - tickLen, cy + ch); ctx.lineTo(cx + cw, cy + ch); ctx.lineTo(cx + cw, cy + ch - tickLen);
    ctx.lineWidth = 2;
    ctx.stroke();

    var titleSize = Math.max(13, Math.round(cw * 0.07));
    ctx.font         = titleSize + 'px ' + fonts.display;
    ctx.fillStyle    = colors.ouro;
    ctx.globalAlpha  = 0.6;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.title, cx + pad, cy + pad);

    if (config.subtitle) {
      var subSize = Math.max(9, Math.round(titleSize * 0.65));
      ctx.font        = subSize + 'px ' + fonts.sans;
      ctx.globalAlpha = 0.4;
      ctx.fillText(config.subtitle, cx + pad, cy + pad + titleSize + 6);
    }

    ctx.restore();
  }
}
