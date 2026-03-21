/**
 * Fleet Map — Atmosphere Layer
 * ==============================
 * Renders fog vignette and edge darkening over all other layers.
 *
 * This is a STATIC layer — only redraws on resize or theme change.
 * Canvas: fleetCanvasAtmo (z-index: 5, top layer, pointer-events: none)
 *
 * Theme-aware properties:
 *   theme.atmosphere.vignetteStrength — 0.0 (none) to 1.0 (full)
 *   theme.atmosphere.noiseTexture     — boolean
 *   theme.atmosphere.colorFilter      — null | 'sepia' | 'crt-green' | 'crt-amber'
 */

/**
 * Parse the r, g, b channels from a CSS rgba string like 'rgba(4,10,16,1)'.
 */
function parseRGB(rgbaStr) {
  var m = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return { r: 4, g: 10, b: 16 };
  return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
}

function rgba(r, g, b, a) {
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/**
 * Draw the atmosphere layer.
 *
 * Supports two call signatures:
 *   drawAtmosphere(ctx, cm, config)     — CanvasManager style
 *   drawAtmosphere(ctx, w, h, config)   — explicit style
 *
 * The optional 5th argument is the theme object for theme-aware rendering.
 */
export function drawAtmosphere(ctx, cmOrW, configOrH, configArg, themeArg) {
  var w, h, config, theme;

  if (typeof cmOrW === 'object' && cmOrW.w !== undefined) {
    w = cmOrW.w;
    h = cmOrW.h;
    config = configOrH;
    theme = configArg || null;
  } else {
    w = cmOrW;
    h = configOrH;
    config = configArg;
    theme = themeArg || null;
  }

  var deep = parseRGB(config.colors.deep);
  var r = deep.r;
  var g = deep.g;
  var b = deep.b;

  var accent = parseRGB(config.colors.ouro || 'rgba(212,165,74,1)');
  var ar = accent.r;
  var ag = accent.g;
  var ab = accent.b;

  // Resolve theme atmosphere settings
  var atmo = (theme && theme.atmosphere) || {};
  var vignetteStrength = atmo.vignetteStrength !== undefined ? atmo.vignetteStrength : 0.6;
  var colorFilter = atmo.colorFilter || null;

  // ------------------------------------------------------------------
  // 1. Clear to transparent
  // ------------------------------------------------------------------
  ctx.clearRect(0, 0, w, h);

  // ------------------------------------------------------------------
  // 2. Radial vignette — strength controlled by theme
  // ------------------------------------------------------------------
  var cx = w * 0.5;
  var cy = h * 0.5;
  var cornerR = Math.sqrt(cx * cx + cy * cy);

  if (vignetteStrength > 0) {
    var vs = vignetteStrength;
    var vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, cornerR);
    vignette.addColorStop(0.0, rgba(r, g, b, 0));
    vignette.addColorStop(0.35, rgba(r, g, b, 0));
    vignette.addColorStop(0.65, rgba(r, g, b, 0.1 * vs));
    vignette.addColorStop(0.8, rgba(r, g, b, 0.22 * vs));
    vignette.addColorStop(0.92, rgba(r, g, b, 0.38 * vs));
    vignette.addColorStop(1.0, rgba(r, g, b, 0.5 * vs));

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  // ------------------------------------------------------------------
  // 3. Warm accent glow — subtle gold light from bottom-center
  // ------------------------------------------------------------------
  var glowGrad = ctx.createRadialGradient(w * 0.4, h * 0.85, 0, w * 0.4, h * 0.85, h * 0.6);
  glowGrad.addColorStop(0.0, rgba(ar, ag, ab, 0.02));
  glowGrad.addColorStop(0.5, rgba(ar, ag, ab, 0.008));
  glowGrad.addColorStop(1.0, rgba(ar, ag, ab, 0));

  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);

  // ------------------------------------------------------------------
  // 4. Top fog band
  // ------------------------------------------------------------------
  var topH = h * 0.18;
  var topFog = ctx.createLinearGradient(0, 0, 0, topH);
  topFog.addColorStop(0.0, rgba(r, g, b, 0.35 * vignetteStrength));
  topFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = topFog;
  ctx.fillRect(0, 0, w, topH);

  // ------------------------------------------------------------------
  // 5. Bottom fog band
  // ------------------------------------------------------------------
  var botH    = h * 0.15;
  var botTop  = h - botH;
  var botFog  = ctx.createLinearGradient(0, h, 0, botTop);
  botFog.addColorStop(0.0, rgba(r, g, b, 0.3 * vignetteStrength));
  botFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = botFog;
  ctx.fillRect(0, botTop, w, botH);

  // ------------------------------------------------------------------
  // 6. Left edge fade
  // ------------------------------------------------------------------
  var leftW = w * 0.06;
  var leftFog = ctx.createLinearGradient(0, 0, leftW, 0);
  leftFog.addColorStop(0.0, rgba(r, g, b, 0.2 * vignetteStrength));
  leftFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = leftFog;
  ctx.fillRect(0, 0, leftW, h);

  // ------------------------------------------------------------------
  // 7. Right edge fade
  // ------------------------------------------------------------------
  var rightW = w * 0.04;
  var rightFog = ctx.createLinearGradient(w, 0, w - rightW, 0);
  rightFog.addColorStop(0.0, rgba(r, g, b, 0.15 * vignetteStrength));
  rightFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = rightFog;
  ctx.fillRect(w - rightW, 0, rightW, h);

  // ------------------------------------------------------------------
  // 8. Color filter (sepia, crt-green, crt-amber)
  // ------------------------------------------------------------------
  if (colorFilter === 'sepia') {
    ctx.fillStyle = 'rgba(180,140,80,0.06)';
    ctx.fillRect(0, 0, w, h);
  } else if (colorFilter === 'crt-green') {
    ctx.fillStyle = 'rgba(0,255,80,0.03)';
    ctx.fillRect(0, 0, w, h);
    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    for (var sl = 0; sl < h; sl += 3) {
      ctx.fillRect(0, sl, w, 1);
    }
  } else if (colorFilter === 'crt-amber') {
    ctx.fillStyle = 'rgba(255,180,50,0.04)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (var sa = 0; sa < h; sa += 3) {
      ctx.fillRect(0, sa, w, 1);
    }
  }
}
