/**
 * Fleet Map — Coast Layer
 * ========================
 * Renders the coastline, land fill, labels, ports, shipping routes,
 * and a decorative cartouche.
 *
 * Canvas: fleetCanvasCoast (z-index: 2)
 *
 * Customizable via config.colors:
 *   .land       — Array of 3 gradient stops [dark, mid, dark]
 *   .coastLine  — Coast outline color
 *   .coastGlow  — Outer glow color
 *   .verde      — Port marker color
 *   .blade      — Subtle text / route color
 *   .ouro       — Accent gold
 *   .creme      — Light text color
 *
 * Customizable via config.fonts:
 *   .display    — Display / title font
 *   .sans       — Sans-serif for labels
 */

import { drawLabel } from '../assets/text/labels.js';

/**
 * Build the smooth coastline path using quadratic bezier curves.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array}    coastData — [[lat,lon], ...]
 * @param {function} projFn    — projFn(lat,lon) => {x,y}
 * @returns {{ first: {x,y}, last: {x,y} }}
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

  // Final segment to last point
  var last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);

  return { first: pts[0], last: last };
}

/**
 * Draw the coast layer.
 *
 * Supports two call signatures:
 *   drawCoast(ctx, cm, coastData, ports, routes, config, t, renderer)  — CanvasManager style
 *   drawCoast(ctx, w, h, projFn, config, t, coastData, ports, routes, renderer) — explicit style
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasManager|number} cmOrW
 * @param {Array|number} coastDataOrH
 * @param {Array|function} portsOrProjFn
 * @param {Array|object} routesOrConfig
 * @param {object|number} configOrT
 * @param {number} [tOrCoastData]
 * @param {object} [rendererArg]
 */
export function drawCoast(ctx, cmOrW, coastDataOrH, portsOrProjFn, routesOrConfig, configOrT, tOrCoastData, rendererArg) {
  var w, h, projFn, config, t, coastData, ports, routes, renderer;

  if (typeof cmOrW === 'object' && cmOrW.w !== undefined) {
    // CanvasManager style: (ctx, cm, coastData, ports, routes, config, t, renderer)
    w = cmOrW.w;
    h = cmOrW.h;
    projFn = cmOrW.proj.bind(cmOrW);
    coastData = coastDataOrH;
    ports = portsOrProjFn;
    routes = routesOrConfig;
    config = configOrT;
    t = tOrCoastData;
    renderer = rendererArg;
  } else {
    // Explicit style: (ctx, w, h, projFn, config, t, coastData, ports, routes, renderer)
    w = cmOrW;
    h = coastDataOrH;
    projFn = portsOrProjFn;
    config = routesOrConfig;
    t = configOrT;
    coastData = tOrCoastData;
    ports = arguments[7];
    routes = arguments[8];
    renderer = arguments[9];
  }

  var colors = config.colors;
  var fonts  = config.fonts;
  var theme  = (renderer && renderer.theme) || null;

  // Resolve theme-driven port settings
  var portPulseSpeed = 2.5;
  if (theme && theme.symbols && theme.symbols.port && theme.symbols.port.pulseSpeed !== undefined) {
    portPulseSpeed = theme.symbols.port.pulseSpeed;
  }

  // Label opts shared by all drawLabel calls in this layer
  var labelOpts = { w: w, fonts: fonts, colors: colors, theme: theme };

  // ------------------------------------------------------------------
  // 1. Land fill — coastline closed along right edge of canvas
  // ------------------------------------------------------------------
  var ends = traceCoast(ctx, coastData, projFn);

  // Close the path along the right/bottom edge (land is east)
  ctx.lineTo(w + 10, ends.last.y);
  ctx.lineTo(w + 10, ends.first.y);
  ctx.closePath();

  // Linear gradient across the land mass
  var landStops = colors.land;
  var landGrad  = ctx.createLinearGradient(w * 0.6, 0, w, 0);
  landGrad.addColorStop(0.0, landStops[0]);
  landGrad.addColorStop(0.5, landStops[1]);
  landGrad.addColorStop(1.0, landStops[2]);

  ctx.fillStyle = landGrad;
  ctx.fill();

  // ------------------------------------------------------------------
  // 2. Coast outline — double stroke (glow + crisp line)
  // ------------------------------------------------------------------
  // Outer glow
  traceCoast(ctx, coastData, projFn);
  ctx.strokeStyle = colors.coastGlow;
  ctx.lineWidth   = 6;
  ctx.stroke();

  // Crisp line
  traceCoast(ctx, coastData, projFn);
  ctx.strokeStyle = colors.coastLine;
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // ------------------------------------------------------------------
  // 3. Land labels — using the label system
  // ------------------------------------------------------------------
  var bz = projFn(-18, -42);
  drawLabel(ctx, 'land-mass', 'BRAZIL', bz.x, bz.y, {
    w: w, fonts: fonts, colors: colors, theme: theme,
    color: colors.coastLine,
    rotation: -0.35,
  });

  var sa = projFn(-28, -38);
  drawLabel(ctx, 'water-body', 'SOUTH ATLANTIC', sa.x, sa.y, {
    w: w, fonts: fonts, colors: colors, theme: theme,
    color: colors.blade,
    rotation: -0.18,
  });

  ctx.globalAlpha = 1;

  // ------------------------------------------------------------------
  // 4. Shipping routes — animated dashed lines
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

      // Route label using label system
      var labelIdx = Math.min(2, rPts.length - 1);
      var rlp      = projFn(rPts[labelIdx][0], rPts[labelIdx][1]);
      ctx.globalAlpha = 1;
      drawLabel(ctx, 'route-label', '\u2192 ' + route.name, rlp.x + 6, rlp.y, {
        w: w, fonts: fonts, colors: colors, theme: theme,
        color: colors.blade,
      });
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // 5. Ports — using renderer.drawPort() when available,
  //    with theme-driven pulse speed
  // ------------------------------------------------------------------
  if (ports && ports.length) {
    for (var pi = 0; pi < ports.length; pi++) {
      var port   = ports[pi];
      var pp     = projFn(port.lat, port.lon);
      var major  = port.size === 'major';
      var radius = major ? 6 : 3.5;

      // Pulse rings for major ports (theme-driven speed)
      if (major && portPulseSpeed > 0) {
        var pulse  = Math.sin(t * portPulseSpeed) * 0.5 + 0.5;
        var pulse2 = Math.sin(t * portPulseSpeed + 1.5) * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(pp.x, pp.y, radius + 4 + pulse * 8, 0, Math.PI * 2);
        ctx.strokeStyle = colors.verde;
        ctx.globalAlpha = 0.18 * (1 - pulse);
        ctx.lineWidth   = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pp.x, pp.y, radius + 2 + pulse2 * 5, 0, Math.PI * 2);
        ctx.globalAlpha = 0.1 * (1 - pulse2);
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }

      // Use renderer.drawPort() for the port symbol if available
      if (renderer) {
        renderer.drawPort(ctx, port, pp, {
          t: t,
          colors: colors,
          fonts: fonts,
          w: w,
        });
      } else {
        // Fallback: simple dot rendering

        // Port glow
        var portGlow = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, radius * 4);
        portGlow.addColorStop(0, colors.verde.replace ? colors.verde.replace(/[\d.]+\)$/, '0.15)') : 'rgba(10,126,110,0.15)');
        portGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle   = portGlow;
        ctx.globalAlpha = 1;
        ctx.fillRect(pp.x - radius * 4, pp.y - radius * 4, radius * 8, radius * 8);

        // Port dot with border
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle   = colors.verde;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.strokeStyle = colors.verde.replace ? colors.verde.replace(/[\d.]+\)$/, '0.4)') : 'rgba(10,126,110,0.4)';
        ctx.lineWidth   = 0.5;
        ctx.stroke();

        // Inner highlight dot for major ports
        if (major) {
          ctx.beginPath();
          ctx.arc(pp.x, pp.y, radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle   = colors.creme || 'rgba(245,237,216,1)';
          ctx.globalAlpha = 0.4;
          ctx.fill();
        }
      }

      // Port label using label system
      ctx.globalAlpha = 1;
      drawLabel(ctx, 'port-name', port.name, pp.x + radius + 6, pp.y, {
        w: w, fonts: fonts, colors: colors, theme: theme,
        color: colors.verde,
      });
    }

    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------
  // 6. Cartouche — ornate decorative title frame (top-left)
  //    Uses drawLabel for title and subtitle text
  // ------------------------------------------------------------------
  if (config.title) {
    ctx.save();

    var ccx = 20;
    var ccy = 20;
    var ccw = Math.min(280, w * 0.3);
    var cch = config.subtitle ? 78 : 52;
    var cpad = 16;

    // Background fill — semi-transparent dark panel
    ctx.fillStyle   = colors.deep || 'rgba(3,8,16,1)';
    ctx.globalAlpha = 0.35;
    ctx.fillRect(ccx + 2, ccy + 2, ccw - 4, cch - 4);

    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = colors.ouro;

    // Outer border
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ccx, ccy, ccw, cch);

    // Inner border (double-line effect)
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(ccx + 5, ccy + 5, ccw - 10, cch - 10);

    // Corner ornaments — L-shaped corner brackets
    ctx.globalAlpha = 0.55;
    var ctickLen = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ccx - 2, ccy + ctickLen);  ctx.lineTo(ccx - 2, ccy - 2);  ctx.lineTo(ccx + ctickLen, ccy - 2);
    ctx.moveTo(ccx + ccw - ctickLen, ccy - 2);  ctx.lineTo(ccx + ccw + 2, ccy - 2);  ctx.lineTo(ccx + ccw + 2, ccy + ctickLen);
    ctx.moveTo(ccx - 2, ccy + cch - ctickLen);  ctx.lineTo(ccx - 2, ccy + cch + 2);  ctx.lineTo(ccx + ctickLen, ccy + cch + 2);
    ctx.moveTo(ccx + ccw - ctickLen, ccy + cch + 2);  ctx.lineTo(ccx + ccw + 2, ccy + cch + 2);  ctx.lineTo(ccx + ccw + 2, ccy + cch - ctickLen);
    ctx.stroke();

    // Decorative line under title
    ctx.globalAlpha = 0.2;
    ctx.lineWidth   = 0.5;
    var lineY = ccy + cpad + Math.max(14, Math.round(ccw * 0.07)) + 4;
    ctx.beginPath();
    ctx.moveTo(ccx + cpad, lineY);
    ctx.lineTo(ccx + ccw - cpad, lineY);
    ctx.stroke();

    // Small diamond accent at line center
    var diamX = ccx + ccw * 0.5;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(diamX, lineY - 3);
    ctx.lineTo(diamX + 3, lineY);
    ctx.lineTo(diamX, lineY + 3);
    ctx.lineTo(diamX - 3, lineY);
    ctx.closePath();
    ctx.fillStyle = colors.ouro;
    ctx.fill();

    // Title text via label system
    ctx.globalAlpha = 1;
    drawLabel(ctx, 'title', config.title, ccx + cpad, ccy + cpad, {
      w: w, fonts: fonts, colors: colors, theme: theme,
      color: colors.ouro,
    });

    // Subtitle via label system
    if (config.subtitle) {
      drawLabel(ctx, 'subtitle', config.subtitle, ccx + cpad, lineY + 8, {
        w: w, fonts: fonts, colors: colors, theme: theme,
        color: colors.ouro,
      });
    }

    ctx.restore();
  }
}
