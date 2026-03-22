/**
 * Viking Village Fleet Map — Atmosphere Layer
 * =============================================
 * Fog vignette and edge darkening. Creates a "looking through a
 * porthole" or "framed nautical chart" feeling.
 *
 * Static layer — only redraws on resize.
 * Canvas: fleetCanvasAtmo (z-index: 5)
 */

function parseRGB(rgbaStr) {
  var m = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return { r: 15, g: 27, b: 61 }; // fallback to indigo
  return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
}

function rgba(r, g, b, a) {
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/**
 * Draw the atmosphere layer.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasManager} cm — canvas manager
 * @param {object} config
 */
export function drawAtmosphere(ctx, cm, config) {
  var w = cm.w;
  var h = cm.h;
  var deep = parseRGB(config.colors.deep);
  var r = deep.r;
  var g = deep.g;
  var b = deep.b;

  ctx.clearRect(0, 0, w, h);

  // Radial vignette
  var cx = w * 0.5;
  var cy = h * 0.5;
  var cornerR = Math.sqrt(cx * cx + cy * cy);

  var vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, cornerR);
  vignette.addColorStop(0.0, rgba(r, g, b, 0));
  vignette.addColorStop(0.4, rgba(r, g, b, 0));
  vignette.addColorStop(0.7, rgba(r, g, b, 0.12));
  vignette.addColorStop(0.85, rgba(r, g, b, 0.25));
  vignette.addColorStop(1.0, rgba(r, g, b, 0.4));

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Top fog
  var topH = h * 0.15;
  var topFog = ctx.createLinearGradient(0, 0, 0, topH);
  topFog.addColorStop(0.0, rgba(r, g, b, 0.3));
  topFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = topFog;
  ctx.fillRect(0, 0, w, topH);

  // Bottom fog
  var botH    = h * 0.12;
  var botTop  = h - botH;
  var botFog  = ctx.createLinearGradient(0, h, 0, botTop);
  botFog.addColorStop(0.0, rgba(r, g, b, 0.25));
  botFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = botFog;
  ctx.fillRect(0, botTop, w, botH);
}
