/**
 * Fleet Map — Vessels Layer
 * ==========================
 * Renders vessel symbols, wake trails, ping rings, fishing zone
 * halos, name labels, and a decorative compass rose.
 *
 * Canvas: fleetCanvasVessels (z-index: 4, top layer)
 * Redraws every frame.
 *
 * Theme-aware properties:
 *   theme.symbols.vessel.glowRadius  — fishing halo radius
 *   theme.symbols.vessel.trailStyle  — 'line' | 'dotted' | 'none'
 *   theme.symbols.vessel.fillAlpha   — vessel fill opacity
 *   theme.emphasis.compass           — compass rose scale
 */

import { drawLabel } from '../assets/text/labels.js';
import { scaleFor, emphasisFor } from '../assets/scale.js';

var TAU = Math.PI * 2;

/**
 * Return a fill color string for a vessel based on its status.
 */
function statusColor(colors, status, alpha) {
  var base;
  switch (status) {
    case 'Fishing':
    case 'Scalloping': base = colors.ouro;  break;
    case 'In Port':    base = colors.verde; break;
    case 'In Transit':
    case 'Returning':  base = colors.blade; break;
    default:           base = colors.blade; break;
  }
  return base.replace(/[\d.]+\)$/, alpha + ')');
}

/**
 * Draw the vessels layer.
 *
 * @param {CanvasRenderingContext2D} ctx     — canvas context
 * @param {CanvasManager|number} cmOrW      — canvas manager or width
 * @param {Array|number}  vesselsOrH        — vessels array or height
 * @param {object}   config  — merged FleetMap config
 * @param {number}   t       — animation time counter
 * @param {object}   [renderer] — AssetRenderer instance (optional)
 *
 * Supports two call signatures:
 *   drawVessels(ctx, cm, vessels, config, t, renderer)      — CanvasManager style
 *   drawVessels(ctx, w, h, projFn, config, t, vessels, renderer) — explicit style
 */
export function drawVessels(ctx, cmOrW, vesselsOrH, config, t, renderer) {
  var w, h, projFn, vessels;

  // Detect call signature
  if (typeof cmOrW === 'object' && cmOrW.w !== undefined) {
    w = cmOrW.w;
    h = cmOrW.h;
    projFn = cmOrW.proj.bind(cmOrW);
    vessels = vesselsOrH;
  } else {
    w = cmOrW;
    h = vesselsOrH;
    projFn = config;
    config = t;
    t = renderer;
    vessels = arguments[6];
    renderer = arguments[7];
  }

  var colors = config.colors;
  var fonts  = config.fonts;
  var theme  = (renderer && renderer.theme) || null;

  // Resolve theme-driven vessel settings
  var vesselSymbols = (theme && theme.symbols && theme.symbols.vessel) || {};
  var glowRadius    = vesselSymbols.glowRadius !== undefined ? vesselSymbols.glowRadius : 32;
  var trailStyle    = vesselSymbols.trailStyle || 'line';
  var themeFillAlpha = vesselSymbols.fillAlpha !== undefined ? vesselSymbols.fillAlpha : 0.9;

  // ------------------------------------------------------------------
  // 1. Clear canvas (transparent)
  // ------------------------------------------------------------------
  ctx.clearRect(0, 0, w, h);

  if (!vessels || !vessels.length) {
    drawCompassRose(ctx, w, h, config, t, theme);
    return;
  }

  var i, v, sp;

  // ------------------------------------------------------------------
  // 2. Fishing zone halos — theme-driven glowRadius
  // ------------------------------------------------------------------
  if (glowRadius > 0) {
    for (i = 0; i < vessels.length; i++) {
      v = vessels[i];
      if (v.status !== 'Fishing' && v.status !== 'Scalloping') continue;

      sp = projFn(v.lat, v.lon);
      var haloRadius = glowRadius + Math.sin(t * 1.2 + i) * (glowRadius * 0.2);
      var innerHalo  = glowRadius * 0.5 + Math.sin(t * 2.0 + i * 1.3) * (glowRadius * 0.1);

      // Outer glow
      var haloGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, haloRadius);
      haloGrad.addColorStop(0, colors.ouro.replace(/[\d.]+\)$/, '0.06)'));
      haloGrad.addColorStop(0.5, colors.ouro.replace(/[\d.]+\)$/, '0.03)'));
      haloGrad.addColorStop(1, colors.ouro.replace(/[\d.]+\)$/, '0)'));

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, haloRadius, 0, TAU);
      ctx.fill();

      // Inner warm glow
      var innerGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, innerHalo);
      innerGrad.addColorStop(0, colors.ouro.replace(/[\d.]+\)$/, '0.12)'));
      innerGrad.addColorStop(1, colors.ouro.replace(/[\d.]+\)$/, '0)'));

      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, innerHalo, 0, TAU);
      ctx.fill();
    }
  }

  // ------------------------------------------------------------------
  // 3. Wake trails — theme-driven trailStyle
  // ------------------------------------------------------------------
  if (trailStyle !== 'none') {
    for (i = 0; i < vessels.length; i++) {
      v = vessels[i];
      if (!v.trail || v.trail.length < 2) continue;

      ctx.beginPath();
      var tp0 = v.trail[0];
      ctx.moveTo(tp0.x, tp0.y);

      for (var ti = 1; ti < v.trail.length; ti++) {
        ctx.lineTo(v.trail[ti].x, v.trail[ti].y);
      }

      ctx.strokeStyle = colors.ouro.replace(/[\d.]+\)$/, '0.15)');
      ctx.lineWidth   = 1.5;
      ctx.globalAlpha = 1;

      if (trailStyle === 'dotted') {
        ctx.setLineDash([2, 4]);
      }

      ctx.stroke();

      if (trailStyle === 'dotted') {
        ctx.setLineDash([]);
      }
    }
  }

  // ------------------------------------------------------------------
  // 4. Vessel symbols
  // ------------------------------------------------------------------
  for (i = 0; i < vessels.length; i++) {
    v  = vessels[i];
    sp = projFn(v.lat, v.lon);

    // Store screen position for hover detection
    v._sx = sp.x;
    v._sy = sp.y;

    var heading = v.heading || 0;
    var rad     = heading * Math.PI / 180;

    // Fill based on status
    var fillAlpha;
    switch (v.status) {
      case 'Fishing':
      case 'Scalloping': fillAlpha = themeFillAlpha; break;
      case 'In Port':    fillAlpha = themeFillAlpha * 0.78; break;
      default:           fillAlpha = themeFillAlpha * 0.78; break;
    }
    var vesselColor = statusColor(colors, v.status, fillAlpha);

    // Use asset renderer if available, otherwise fall back to triangle
    if (renderer) {
      renderer.drawVessel(ctx, v, sp, {
        t: t,
        colors: colors,
        fonts: fonts,
        w: w,
        index: i,
      });
    } else {
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(rad);

      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(-3, 4);
      ctx.lineTo(3, 4);
      ctx.closePath();

      ctx.fillStyle = vesselColor;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth   = 0.5;
      ctx.stroke();

      ctx.restore();
    }

    // ------------------------------------------------------------------
    // 5. Ping rings
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // 6. Name labels — via the label system with shadow for readability
    // ------------------------------------------------------------------
    ctx.save();
    ctx.shadowColor = colors.deep || 'rgba(0,0,0,0.8)';
    ctx.shadowBlur  = 4;
    drawLabel(ctx, 'vessel-name', v.name, sp.x, sp.y + 10, {
      w: w, fonts: fonts, colors: colors, theme: theme,
      color: colors.creme,
      alpha: 0.45,
    });
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // 7. Compass rose (bottom-right) — theme-driven scale
  // ------------------------------------------------------------------
  drawCompassRose(ctx, w, h, config, t, theme);
}

/**
 * Draw a decorative compass rose in the bottom-right corner.
 * Uses theme emphasis for scaling. Ornate 16-point star design.
 */
function drawCompassRose(ctx, w, h, config, t, theme) {
  var colors = config.colors;
  var fonts  = config.fonts;

  // Theme-driven compass scale
  var compassEmphasis = emphasisFor('compass', theme);
  var baseR = scaleFor('compass', 'md', w, compassEmphasis);

  var cx     = w - baseR - 28;
  var cy     = h - baseR - 28;
  var outerR = baseR;
  var midR   = Math.round(baseR * 0.71);
  var innerR = Math.round(baseR * 0.38);
  var tickR  = outerR + 6;

  var wobble = Math.sin(t * 0.25) * 0.03;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wobble);

  // Outer double ring
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, TAU);
  ctx.strokeStyle = colors.ouro;
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, outerR + 3, 0, TAU);
  ctx.lineWidth   = 0.4;
  ctx.stroke();

  // Degree tick marks
  for (var deg = 0; deg < 360; deg += 5) {
    var rad    = deg * Math.PI / 180;
    var isCard = (deg % 90 === 0);
    var isOrd  = (deg % 45 === 0) && !isCard;
    var isMaj  = (deg % 15 === 0) && !isCard && !isOrd;
    var tickLen = isCard ? 8 : (isOrd ? 5 : (isMaj ? 4 : 2));
    var r1 = outerR;
    var r2 = outerR + tickLen;

    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
    ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
    ctx.strokeStyle = colors.ouro;
    ctx.lineWidth   = isCard ? 1.2 : (isOrd ? 0.8 : 0.4);
    ctx.globalAlpha = isCard ? 0.3 : 0.15;
    ctx.stroke();
  }

  // 16-point star
  for (var pt = 0; pt < 16; pt++) {
    var angle   = pt * (TAU / 16) - Math.PI / 2;
    var isMain  = (pt % 4 === 0);
    var isSec   = (pt % 2 === 0) && !isMain;
    var starLen = isMain ? outerR - 3 : (isSec ? midR : innerR + 3);
    var halfA   = TAU / 32;
    var sideR   = isMain ? Math.round(outerR * 0.17) : (isSec ? Math.round(outerR * 0.1) : Math.round(outerR * 0.06));

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * starLen, Math.sin(angle) * starLen);
    ctx.lineTo(Math.cos(angle + halfA) * sideR, Math.sin(angle + halfA) * sideR);
    ctx.closePath();

    ctx.fillStyle   = isMain ? colors.ouro : colors.creme;
    ctx.globalAlpha = isMain ? 0.25 : (isSec ? 0.12 : 0.06);
    ctx.fill();

    // Mirror side
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * starLen, Math.sin(angle) * starLen);
    ctx.lineTo(Math.cos(angle - halfA) * sideR, Math.sin(angle - halfA) * sideR);
    ctx.closePath();

    ctx.fillStyle   = isMain ? colors.ouro.replace(/[\d.]+\)$/, '0.15)') : colors.creme;
    ctx.globalAlpha = isMain ? 0.15 : (isSec ? 0.08 : 0.04);
    ctx.fill();
  }

  // Middle ring
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(0, 0, midR, 0, TAU);
  ctx.strokeStyle = colors.ouro;
  ctx.lineWidth   = 0.5;
  ctx.stroke();

  // Cardinal letters
  var letterR     = tickR + 10;
  var letterSize  = Math.max(9, Math.round(w * 0.009));
  ctx.font         = 'bold ' + letterSize + 'px ' + fonts.sans;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle   = colors.ouro;
  ctx.globalAlpha = 0.4;
  ctx.fillText('N', 0, -letterR);
  // Decorative dots flanking N
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(-6, -letterR, 1, 0, TAU);
  ctx.arc(6, -letterR, 1, 0, TAU);
  ctx.fill();

  ctx.fillStyle   = colors.creme;
  ctx.globalAlpha = 0.2;
  ctx.fillText('S', 0, letterR);
  ctx.fillText('E', letterR, 0);
  ctx.fillText('W', -letterR, 0);

  // Ordinal labels
  var ordR = letterR - 2;
  var ordSize = Math.max(6, Math.round(w * 0.005));
  ctx.font = ordSize + 'px ' + fonts.sans;
  ctx.globalAlpha = 0.1;
  var diag = ordR * 0.707;
  ctx.fillText('NE', diag, -diag);
  ctx.fillText('SE', diag, diag);
  ctx.fillText('SW', -diag, diag);
  ctx.fillText('NW', -diag, -diag);

  // Inner ring + center dot
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, TAU);
  ctx.strokeStyle = colors.ouro;
  ctx.lineWidth   = 0.6;
  ctx.globalAlpha = 0.15;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, TAU);
  ctx.fillStyle   = colors.ouro;
  ctx.globalAlpha = 0.3;
  ctx.fill();

  ctx.restore();
}
