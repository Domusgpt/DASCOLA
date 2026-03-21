// ─────────────────────────────────────────────────────────
//  DASCOLA — Navigation Aids & Channel Markers Layer
//  Renders buoys, beacons, lighthouses from config data
// ─────────────────────────────────────────────────────────

import { scaledSize } from '../assets/scale.js';
import { drawLabel } from '../assets/text/labels.js';

/**
 * Draw navigation markers layer
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasManager} cm
 * @param {Array} markers — array of { type, lat, lon, name, light? }
 * @param {AssetRenderer} renderer
 * @param {object} config
 * @param {number} t — animation time
 */
export function drawMarkers(ctx, cm, markers, renderer, config, t) {
  if (!markers || !markers.length) return;

  const { w, h } = cm;
  const theme = renderer.theme;

  ctx.clearRect(0, 0, w, h);

  for (const marker of markers) {
    const pos = cm.proj(marker.lat, marker.lon);
    if (pos.x < -20 || pos.x > w + 20 || pos.y < -20 || pos.y > h + 20) continue;

    const sym = renderer.registry.getSymbol(marker.type);
    if (!sym) continue;

    const size = scaledSize('marker', 'md', w, theme);

    // Bob animation for buoys
    let bobY = 0;
    if (theme.symbols.buoy.bobAnimation && marker.type.startsWith('buoy')) {
      bobY = Math.sin(t * 2 + marker.lon * 10) * 2;
    }

    ctx.save();
    ctx.translate(pos.x, pos.y + bobY);

    // Draw the marker symbol
    if (sym.draw) {
      sym.draw(ctx, size, null, t);
    }

    ctx.restore();

    // Light flash for lit marks
    if (marker.light) {
      const flash = Math.sin(t * marker.light.rate || t * 3) > 0.5;
      if (flash) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y + bobY - size * 0.5, size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = marker.light.color || '#ffe066';
        ctx.fill();
      }
    }

    // Label
    if (marker.name) {
      drawLabel(ctx, 'coordinate', marker.name, pos.x, pos.y + bobY + size * 0.7, {
        canvasWidth: w,
        fonts: theme.fonts,
        color: theme.colors.creme,
        theme,
      });
    }
  }
}
