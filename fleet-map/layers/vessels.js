/**
 * Fleet Map — Vessels Layer
 * ==========================
 * Renders vessel silhouettes (or triangles), wake trails, ping rings,
 * fishing zone halos, name labels, and a decorative compass rose.
 *
 * Supports asset design system: when an AssetRenderer is provided,
 * vessels render as themed silhouettes. Falls back to simple triangles.
 *
 * Canvas: fleetCanvasVessels (z-index: 6, animated)
 * Redraws every frame.
 */

var TAU = Math.PI * 2;

/**
 * Return a fill color string for a vessel based on its status.
 */
function statusColor(colors, status, alpha) {
  var base;
  switch (status) {
    case 'Fishing':   base = colors.ouro;  break;
    case 'In Port':   base = colors.verde; break;
    case 'In Transit':
    case 'Returning': base = colors.blade; break;
    default:          base = colors.blade; break;
  }
  return base.replace(/[\d.]+\)$/, alpha + ')');
}

/**
 * Draw the vessels layer.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasManager} cm
 * @param {Array} vessels
 * @param {object} config
 * @param {number} t
 * @param {AssetRenderer} [renderer] — optional asset renderer for themed silhouettes
 */
export function drawVessels(ctx, cm, vessels, config, t, renderer) {
  var w = cm.w;
  var h = cm.h;
  var colors = config.colors;
  var fonts  = config.fonts;
  var useAssets = renderer && config.assets && config.assets.vesselStyle === 'silhouette';

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  if (!vessels || !vessels.length) {
    drawCompassRose(ctx, w, h, config, t);
    return;
  }

  var i, v, sp;

  // If using asset renderer, delegate full vessel rendering
  if (useAssets) {
    // Wake trails first (behind everything)
    for (i = 0; i < vessels.length; i++) {
      v = vessels[i];
      if (!v.trail || v.trail.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(v.trail[0].x, v.trail[0].y);
      for (var ti = 1; ti < v.trail.length; ti++) {
        ctx.lineTo(v.trail[ti].x, v.trail[ti].y);
      }
      ctx.strokeStyle = colors.ouro.replace(/[\d.]+\)$/, '0.15)');
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Render each vessel via asset renderer
    for (i = 0; i < vessels.length; i++) {
      v = vessels[i];
      sp = cm.proj(v.lat, v.lon);
      v._sx = sp.x;
      v._sy = sp.y;
      v._idx = i;

      renderer.drawVessel(ctx, v, sp.x, sp.y, {
        canvasWidth: w,
        t: t,
        showLabel: true,
        showBadge: config.assets.showStatusBadges,
        showEta: config.assets.showEta,
      });
    }

    drawCompassRose(ctx, w, h, config, t);
    return;
  }

  // ── Fallback: original triangle rendering ──

  // Fishing zone halos
  for (i = 0; i < vessels.length; i++) {
    v = vessels[i];
    if (v.status !== 'Fishing') continue;

    sp = cm.proj(v.lat, v.lon);
    var haloRadius = 32 + Math.sin(t * 1.5 + i) * 6;

    var haloGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, haloRadius);
    haloGrad.addColorStop(0, colors.ouro.replace(/[\d.]+\)$/, '0.08)'));
    haloGrad.addColorStop(1, colors.ouro.replace(/[\d.]+\)$/, '0)'));

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, haloRadius, 0, TAU);
    ctx.fill();
  }

  // Wake trails
  for (i = 0; i < vessels.length; i++) {
    v = vessels[i];
    if (!v.trail || v.trail.length < 2) continue;

    ctx.beginPath();
    var tp0 = v.trail[0];
    ctx.moveTo(tp0.x, tp0.y);

    for (var ti2 = 1; ti2 < v.trail.length; ti2++) {
      ctx.lineTo(v.trail[ti2].x, v.trail[ti2].y);
    }

    ctx.strokeStyle = colors.ouro.replace(/[\d.]+\)$/, '0.15)');
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 1;
    ctx.stroke();
  }

  // Vessel triangles
  for (i = 0; i < vessels.length; i++) {
    v  = vessels[i];
    sp = cm.proj(v.lat, v.lon);

    v._sx = sp.x;
    v._sy = sp.y;

    var heading = v.heading || 0;
    var rad     = heading * Math.PI / 180;

    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(rad);

    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-3, 4);
    ctx.lineTo(3, 4);
    ctx.closePath();

    var fillAlpha;
    switch (v.status) {
      case 'Fishing':   fillAlpha = 0.9; break;
      case 'In Port':   fillAlpha = 0.7; break;
      default:          fillAlpha = 0.7; break;
    }
    ctx.fillStyle = statusColor(colors, v.status, fillAlpha);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();

    ctx.restore();

    // Ping rings
    var phase = (t * 0.8 + i * 0.5) % 2;
    if (phase < 1) {
      var pingR     = 4 + phase * 12;
      var pingAlpha = (1 - phase) * 0.5;

      ctx.beginPath();
      ctx.arc(sp.x, sp.y, pingR, 0, TAU);
      ctx.strokeStyle = statusColor(colors, v.status, pingAlpha);
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // Name labels
    var nameFontSize = Math.max(8, Math.round(w * 0.007));
    ctx.font         = nameFontSize + 'px ' + fonts.sans;
    ctx.fillStyle    = colors.creme.replace(/[\d.]+\)$/, '0.3)');
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(v.name, sp.x, sp.y + 8);
  }

  // Compass rose
  drawCompassRose(ctx, w, h, config, t);
}

/**
 * Draw a decorative compass rose in the bottom-right corner.
 */
function drawCompassRose(ctx, w, h, config, t) {
  var colors = config.colors;
  var fonts  = config.fonts;

  var cx     = w - 60;
  var cy     = h - 60;
  var outerR = 35;
  var innerR = 14;
  var tickR  = outerR + 6;

  var wobble = Math.sin(t * 0.3) * 0.05;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wobble);
  ctx.globalAlpha = 0.2;

  // Outer circle
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, TAU);
  ctx.strokeStyle = colors.ouro;
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // Degree tick marks
  for (var deg = 0; deg < 360; deg += 10) {
    var rad    = deg * Math.PI / 180;
    var isCard = (deg % 90 === 0);
    var tickLen = isCard ? 6 : 3;
    var r1 = outerR;
    var r2 = outerR + tickLen;

    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
    ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
    ctx.strokeStyle = colors.ouro;
    ctx.lineWidth   = isCard ? 1 : 0.5;
    ctx.stroke();
  }

  // 8-point star
  ctx.globalAlpha = 0.25;
  for (var pt = 0; pt < 8; pt++) {
    var angle   = pt * (TAU / 8) - Math.PI / 2;
    var isMain  = (pt % 2 === 0);
    var starLen = isMain ? outerR - 2 : innerR + 4;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * starLen, Math.sin(angle) * starLen);

    var halfAngle = TAU / 16;
    var sideR     = isMain ? 6 : 4;
    ctx.lineTo(
      Math.cos(angle - halfAngle) * sideR,
      Math.sin(angle - halfAngle) * sideR
    );
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * starLen, Math.sin(angle) * starLen);
    ctx.lineTo(
      Math.cos(angle + halfAngle) * sideR,
      Math.sin(angle + halfAngle) * sideR
    );
    ctx.closePath();

    ctx.fillStyle = isMain ? colors.ouro : colors.creme;
    ctx.globalAlpha = isMain ? 0.2 : 0.1;
    ctx.fill();
  }

  // Cardinal letters
  ctx.globalAlpha = 0.25;
  var letterR     = tickR + 8;
  var letterSize  = Math.max(8, Math.round(w * 0.008));
  ctx.font         = letterSize + 'px ' + fonts.sans;
  ctx.fillStyle    = colors.creme;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText('N', 0, -letterR);
  ctx.fillText('S', 0, letterR);
  ctx.fillText('E', letterR, 0);
  ctx.fillText('W', -letterR, 0);

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, TAU);
  ctx.strokeStyle = colors.ouro;
  ctx.lineWidth   = 0.5;
  ctx.globalAlpha = 0.15;
  ctx.stroke();

  ctx.restore();
}
