/**
 * Fleet Map — Atmosphere Layer
 * ==============================
 * Renders fog vignette and edge darkening over all other layers.
 *
 * This is a STATIC layer — only redraws on resize.
 * Canvas: fleetCanvasAtmo (z-index: 5, top layer, pointer-events: none)
 *
 * Creates the "looking through a porthole" feeling with darkened
 * edges and subtle fog gradients at top and bottom.
 */

/**
 * Parse the r, g, b channels from a CSS rgba string like 'rgba(4,10,16,1)'.
 * Returns an object { r, g, b }.
 */
function parseRGB(rgbaStr) {
  var m = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return { r: 4, g: 10, b: 16 }; // fallback to default deep
  return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
}

/**
 * Build an rgba() color string from r, g, b values and an alpha.
 */
function rgba(r, g, b, a) {
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/**
 * Draw the atmosphere layer: vignette, top fog, bottom fog, and accent glow.
 *
 * Supports two call signatures:
 *   drawAtmosphere(ctx, cm, config)              — CanvasManager style
 *   drawAtmosphere(ctx, w, h, config)             — explicit style
 *
 * @param {CanvasRenderingContext2D} ctx    — canvas context
 * @param {CanvasManager|number} cmOrW     — canvas manager or width
 * @param {object|number} configOrH        — config or height
 * @param {object} [configArg]             — config (explicit style)
 */
export function drawAtmosphere(ctx, cmOrW, configOrH, configArg) {
  var w, h, config;

  if (typeof cmOrW === 'object' && cmOrW.w !== undefined) {
    w = cmOrW.w;
    h = cmOrW.h;
    config = configOrH;
  } else {
    w = cmOrW;
    h = configOrH;
    config = configArg;
  }

  var deep = parseRGB(config.colors.deep);
  var r = deep.r;
  var g = deep.g;
  var b = deep.b;

  // Parse accent color for glow effects
  var accent = parseRGB(config.colors.ouro || 'rgba(212,165,74,1)');
  var ar = accent.r;
  var ag = accent.g;
  var ab = accent.b;

  // ------------------------------------------------------------------
  // 1. Clear to transparent
  // ------------------------------------------------------------------
  ctx.clearRect(0, 0, w, h);

  // ------------------------------------------------------------------
  // 2. Radial vignette — transparent center, darkened edges
  // ------------------------------------------------------------------
  var cx = w * 0.5;
  var cy = h * 0.5;
  var cornerR = Math.sqrt(cx * cx + cy * cy);

  var vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, cornerR);
  vignette.addColorStop(0.0, rgba(r, g, b, 0));
  vignette.addColorStop(0.35, rgba(r, g, b, 0));
  vignette.addColorStop(0.65, rgba(r, g, b, 0.1));
  vignette.addColorStop(0.8, rgba(r, g, b, 0.22));
  vignette.addColorStop(0.92, rgba(r, g, b, 0.38));
  vignette.addColorStop(1.0, rgba(r, g, b, 0.5));

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

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
  // 4. Top fog band — top 18% of canvas
  // ------------------------------------------------------------------
  var topH = h * 0.18;
  var topFog = ctx.createLinearGradient(0, 0, 0, topH);
  topFog.addColorStop(0.0, rgba(r, g, b, 0.35));
  topFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = topFog;
  ctx.fillRect(0, 0, w, topH);

  // ------------------------------------------------------------------
  // 5. Bottom fog band — bottom 15% of canvas
  // ------------------------------------------------------------------
  var botH    = h * 0.15;
  var botTop  = h - botH;
  var botFog  = ctx.createLinearGradient(0, h, 0, botTop);
  botFog.addColorStop(0.0, rgba(r, g, b, 0.3));
  botFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = botFog;
  ctx.fillRect(0, botTop, w, botH);

  // ------------------------------------------------------------------
  // 6. Left edge fade — helps land area blend naturally
  // ------------------------------------------------------------------
  var leftW = w * 0.06;
  var leftFog = ctx.createLinearGradient(0, 0, leftW, 0);
  leftFog.addColorStop(0.0, rgba(r, g, b, 0.2));
  leftFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = leftFog;
  ctx.fillRect(0, 0, leftW, h);

  // ------------------------------------------------------------------
  // 7. Right edge fade — smooths the land edge
  // ------------------------------------------------------------------
  var rightW = w * 0.04;
  var rightFog = ctx.createLinearGradient(w, 0, w - rightW, 0);
  rightFog.addColorStop(0.0, rgba(r, g, b, 0.15));
  rightFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = rightFog;
  ctx.fillRect(w - rightW, 0, rightW, h);
}
