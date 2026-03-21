// ─────────────────────────────────────────────────────────
//  DASCOLA — Asset Renderer
//  Central rendering pipeline: symbol lookup → theme styling → canvas draw
// ─────────────────────────────────────────────────────────

import { scaledSize, textSize } from './scale.js';
import { getVesselSymbol, VESSEL_TYPE_MAP } from './symbols/vessels.js';
import { drawLabel } from './text/labels.js';

export class AssetRenderer {
  /**
   * @param {AssetRegistry} registry
   * @param {string} themeId
   */
  constructor(registry, themeId) {
    this.registry = registry;
    this.theme = registry.getTheme(themeId);
  }

  /**
   * Switch theme at runtime
   */
  setTheme(themeId) {
    this.theme = this.registry.getTheme(themeId);
  }

  /**
   * Draw a registered symbol at a position
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} symbolId
   * @param {number} x
   * @param {number} y
   * @param {object} opts — { size, rotation, color, alpha, category, data, t }
   */
  draw(ctx, symbolId, x, y, opts = {}) {
    const sym = this.registry.getSymbol(symbolId);
    if (!sym || !sym.draw) return;

    const {
      size = 16,
      rotation = 0,
      color,
      alpha = 1,
      data = {},
      t,
    } = opts;

    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.globalAlpha *= alpha;

    sym.draw(ctx, size, color, data, t);

    ctx.restore();
  }

  /**
   * Draw a vessel with full theme-aware rendering
   */
  drawVessel(ctx, vessel, sx, sy, opts = {}) {
    const {
      canvasWidth = 1200,
      t = 0,
      showLabel = true,
      showBadge = false,
      showEta = false,
    } = opts;

    const theme = this.theme;
    const vesselStyle = theme.symbols.vessel.style;
    const sym = getVesselSymbol(vessel.type);
    const size = scaledSize('vessel', 'md', canvasWidth, theme);
    const heading = vessel.heading || 0;
    const headingRad = (heading * Math.PI) / 180;

    // Status color
    const statusColor = this._statusColor(vessel.status);
    const alpha = vessel.status === 'Fishing' ? 0.9 : 0.7;

    // Fishing zone halo
    if (vessel.status === 'Fishing') {
      const glowR = theme.symbols.vessel.glowRadius;
      const pulse = glowR + Math.sin(t * 1.5) * 6;
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, pulse);
      grad.addColorStop(0, this._rgba(statusColor, 0.08));
      grad.addColorStop(1, this._rgba(statusColor, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Trail
    if (vessel.trail && vessel.trail.length > 1) {
      this._drawTrail(ctx, vessel.trail, statusColor, theme.symbols.vessel.trailStyle);
    }

    // Vessel shape
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(headingRad);
    ctx.globalAlpha = alpha;

    const drawFn = vesselStyle === 'profile' ? 'drawProfile' :
                   vesselStyle === 'icon' ? 'drawIcon' : 'drawTopDown';
    if (sym[drawFn]) {
      sym[drawFn](ctx, size, heading, statusColor);
    } else {
      sym.drawTopDown(ctx, size, heading, statusColor);
    }

    ctx.restore();

    // Ping ring
    const pingPhase = ((t * 0.7 + (vessel._idx || 0) * 0.3) % 1);
    const pingR = 4 + pingPhase * 12;
    ctx.beginPath();
    ctx.arc(sx, sy, pingR, 0, Math.PI * 2);
    ctx.strokeStyle = this._rgba(statusColor, 0.3 * (1 - pingPhase));
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Name label
    if (showLabel && vessel.name) {
      drawLabel(ctx, 'vessel-name', vessel.name, sx, sy + size * 0.7, {
        canvasWidth,
        fonts: theme.fonts,
        color: theme.colors.creme,
        theme,
      });
    }

    // Status badge
    if (showBadge && vessel.status) {
      const badge = this.registry.getSymbol('status-badge');
      if (badge) {
        ctx.save();
        ctx.translate(sx + size * 0.6, sy - size * 0.5);
        badge.draw(ctx, size * 0.6, statusColor, {
          label: vessel.status,
          bgColor: this._rgba(statusColor, 0.6),
        });
        ctx.restore();
      }
    }

    // ETA display
    if (showEta && vessel.eta) {
      const eta = this.registry.getSymbol('eta-display');
      if (eta) {
        ctx.save();
        ctx.translate(sx, sy + size * 1.2);
        eta.draw(ctx, size * 0.7, theme.colors.blade, {
          eta: vessel.eta,
          port: vessel.etaPort || '',
        });
        ctx.restore();
      }
    }
  }

  /**
   * Draw a weather station (cluster of weather icons at a point)
   */
  drawWeatherStation(ctx, weatherData, sx, sy, opts = {}) {
    const { canvasWidth = 1200, t = 0 } = opts;
    const theme = this.theme;
    const iconSize = scaledSize('icon', 'md', canvasWidth, theme);

    let offsetY = 0;

    // Wind barb
    if (weatherData.wind) {
      const wb = this.registry.getSymbol('wind-barb');
      if (wb) {
        ctx.save();
        ctx.translate(sx, sy + offsetY);
        wb.draw(ctx, iconSize, theme.colors.creme, {
          speed: weatherData.wind.speed,
          direction: weatherData.wind.direction,
        });
        ctx.restore();
        offsetY += iconSize * 0.8;
      }
    }

    // Wave height
    if (weatherData.waves && weatherData.waves.height > 0) {
      const wh = this.registry.getSymbol('wave-height');
      if (wh) {
        ctx.save();
        ctx.translate(sx, sy + offsetY);
        wh.draw(ctx, iconSize * 0.8, theme.colors.blade, {
          height: weatherData.waves.height,
        });
        ctx.restore();
        offsetY += iconSize * 0.6;
      }
    }

    // Temperature
    if (weatherData.temp && weatherData.temp.water != null) {
      const temp = this.registry.getSymbol('temperature');
      if (temp) {
        ctx.save();
        ctx.translate(sx + iconSize, sy);
        temp.draw(ctx, iconSize * 0.7, null, {
          temp: weatherData.temp.water,
          unit: 'F',
        });
        ctx.restore();
      }
    }

    // Condition symbol (fog, rain, storm, etc.)
    if (weatherData.conditionSymbol) {
      const cs = this.registry.getSymbol(weatherData.conditionSymbol);
      if (cs) {
        ctx.save();
        ctx.translate(sx - iconSize, sy);
        cs.draw(ctx, iconSize * 0.8, theme.colors.creme);
        ctx.restore();
      }
    }
  }

  /**
   * Draw a port with facility icons
   */
  drawPort(ctx, port, sx, sy, opts = {}) {
    const { canvasWidth = 1200, t = 0 } = opts;
    const theme = this.theme;
    const portSize = scaledSize('port', port.size === 'major' ? 'lg' : 'md', canvasWidth, theme);
    const color = theme.colors.verde;

    // Port symbol
    if (theme.symbols.port.shape === 'square') {
      ctx.fillStyle = this._rgba(color, 0.85);
      ctx.fillRect(sx - portSize / 2, sy - portSize / 2, portSize, portSize);
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, portSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = this._rgba(color, 0.85);
      ctx.fill();
    }

    // Pulse ring for major ports
    if (port.size === 'major') {
      const pulse = Math.sin(t * theme.symbols.port.pulseSpeed) * 0.5 + 0.5;
      const ringR = portSize / 2 + 4 + pulse * 6;
      ctx.beginPath();
      ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = this._rgba(color, 0.3 * (1 - pulse));
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Port label
    drawLabel(ctx, 'port-name', port.name, sx + portSize / 2 + 6, sy, {
      canvasWidth,
      fonts: theme.fonts,
      color,
      theme,
    });

    // Facility icons (if any)
    if (port.facilities && port.facilities.length) {
      const fSize = scaledSize('icon', 'sm', canvasWidth, theme) * 0.6;
      let fx = sx - (port.facilities.length * fSize) / 2;
      const fy = sy + portSize / 2 + fSize + 2;
      for (const fac of port.facilities) {
        const sym = this.registry.getSymbol(fac);
        if (sym && sym.draw) {
          ctx.save();
          ctx.translate(fx + fSize / 2, fy);
          ctx.globalAlpha = 0.6;
          sym.draw(ctx, fSize, color);
          ctx.restore();
        }
        fx += fSize + 2;
      }
    }
  }

  // ── Helpers ──────────────────────────────────────

  _statusColor(status) {
    const c = this.theme.colors;
    switch (status) {
      case 'Fishing':    return c.ouro;
      case 'In Port':    return c.verde;
      case 'In Transit': return c.blade;
      case 'Returning':  return c.blade;
      default:           return c.blade;
    }
  }

  _drawTrail(ctx, trail, color, style) {
    if (trail.length < 2) return;
    ctx.strokeStyle = this._rgba(color, 0.15);
    ctx.lineWidth = 1;
    if (style === 'dotted') {
      ctx.setLineDash([2, 4]);
    }
    ctx.beginPath();
    ctx.moveTo(trail[0]._sx, trail[0]._sy);
    for (let i = 1; i < trail.length; i++) {
      if (trail[i]._sx != null) {
        ctx.lineTo(trail[i]._sx, trail[i]._sy);
      }
    }
    ctx.stroke();
    if (style === 'dotted') {
      ctx.setLineDash([]);
    }
  }

  _rgba(cssColor, alpha) {
    if (!cssColor) return `rgba(128,128,128,${alpha})`;
    const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
    return cssColor;
  }
}
