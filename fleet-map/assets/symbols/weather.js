// ─────────────────────────────────────────────────────────
//  DASCOLA — Weather Symbol Definitions
//  Mapped to NOAA marine forecast data
// ─────────────────────────────────────────────────────────

export const WEATHER = {
  'wind-barb': {
    name: 'Wind Barb',
    /**
     * Draw a standard meteorological wind barb
     * @param {number} speed — knots
     * @param {number} direction — degrees (from)
     */
    draw(ctx, size, color, { speed = 10, direction = 0 } = {}) {
      ctx.save();
      ctx.rotate((direction * Math.PI) / 180);
      ctx.strokeStyle = color || '#ccc';
      ctx.fillStyle = color || '#ccc';
      ctx.lineWidth = 1.2;

      const shaft = size * 0.8;
      // Staff
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -shaft);
      ctx.stroke();

      // Draw barbs from top down
      let remaining = speed;
      let y = -shaft;
      const step = shaft * 0.15;
      const barbLen = size * 0.35;

      // Pennants (50 kt)
      while (remaining >= 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(barbLen, y + step * 0.5);
        ctx.lineTo(0, y + step);
        ctx.closePath();
        ctx.fill();
        y += step * 1.2;
        remaining -= 50;
      }
      // Full barbs (10 kt)
      while (remaining >= 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(barbLen, y + step * 0.3);
        ctx.stroke();
        y += step;
        remaining -= 10;
      }
      // Half barb (5 kt)
      if (remaining >= 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(barbLen * 0.5, y + step * 0.2);
        ctx.stroke();
      }

      // Circle at base for calm
      if (speed < 3) {
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    },
  },

  'wave-height': {
    name: 'Wave Indicator',
    draw(ctx, size, color, { height = 0 } = {}) {
      const w = size * 0.8;
      ctx.strokeStyle = color || '#5ba3d9';
      ctx.lineWidth = 1.2;
      // Wave curves
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.quadraticCurveTo(-w / 4, -size * 0.25, 0, 0);
      ctx.quadraticCurveTo(w / 4, size * 0.25, w / 2, 0);
      ctx.stroke();
      // Height label
      if (height > 0) {
        ctx.fillStyle = color || '#5ba3d9';
        ctx.font = `${Math.round(size * 0.3)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${height}ft`, 0, size * 0.3);
      }
    },
  },

  'temperature': {
    name: 'Temperature Badge',
    draw(ctx, size, color, { temp = 0, unit = 'F' } = {}) {
      const r = size * 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = temp > 75 ? 'rgba(200,80,60,0.7)' :
                      temp > 60 ? 'rgba(200,160,60,0.7)' :
                                  'rgba(60,140,200,0.7)';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(size * 0.28)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(temp)}\u00B0`, 0, 0);
    },
  },

  'storm-warning': {
    name: 'Storm Warning Pennant',
    draw(ctx, size, color) {
      const w = size * 0.5, h = size * 0.7;
      // Flagpole
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(0, -h * 0.5);
      ctx.strokeStyle = color || '#ccc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Two red pennants (storm)
      ctx.fillStyle = '#cc3333';
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.lineTo(w, -h * 0.3);
      ctx.lineTo(0, -h * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.05);
      ctx.lineTo(w, h * 0.15);
      ctx.lineTo(0, h * 0.35);
      ctx.closePath();
      ctx.fill();
    },
  },

  'small-craft': {
    name: 'Small Craft Advisory',
    draw(ctx, size, color) {
      const w = size * 0.45, h = size * 0.6;
      // Flagpole
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(0, -h * 0.5);
      ctx.strokeStyle = color || '#ccc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Single red pennant
      ctx.fillStyle = '#cc3333';
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.lineTo(w, -h * 0.25);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
    },
  },

  'fog': {
    name: 'Fog Symbol',
    draw(ctx, size, color) {
      ctx.strokeStyle = color || 'rgba(180,180,180,0.6)';
      ctx.lineWidth = 1;
      const w = size * 0.6;
      for (let i = 0; i < 3; i++) {
        const y = (i - 1) * size * 0.2;
        ctx.beginPath();
        ctx.moveTo(-w / 2, y);
        ctx.lineTo(w / 2, y);
        ctx.stroke();
      }
    },
  },

  'rain': {
    name: 'Rain Indicator',
    draw(ctx, size, color) {
      // Cloud
      const r = size * 0.2;
      ctx.fillStyle = color || 'rgba(150,160,170,0.7)';
      ctx.beginPath();
      ctx.arc(-r * 0.5, -r * 0.5, r, 0, Math.PI * 2);
      ctx.arc(r * 0.5, -r * 0.7, r * 0.8, 0, Math.PI * 2);
      ctx.arc(r * 1.2, -r * 0.4, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      // Rain drops
      ctx.strokeStyle = '#5ba3d9';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const x = -r + i * r;
        ctx.beginPath();
        ctx.moveTo(x, r * 0.3);
        ctx.lineTo(x - r * 0.2, r * 1);
        ctx.stroke();
      }
    },
  },

  'current-arrow': {
    name: 'Current Direction Arrow',
    draw(ctx, size, color, { direction = 0, speed = 1 } = {}) {
      ctx.save();
      ctx.rotate((direction * Math.PI) / 180);
      const len = size * 0.7 * Math.min(speed, 3);
      ctx.strokeStyle = color || '#5ba3d9';
      ctx.fillStyle = color || '#5ba3d9';
      ctx.lineWidth = 1.5;
      // Shaft
      ctx.beginPath();
      ctx.moveTo(0, len / 2);
      ctx.lineTo(0, -len / 2);
      ctx.stroke();
      // Arrowhead
      const aw = size * 0.15;
      ctx.beginPath();
      ctx.moveTo(0, -len / 2 - aw);
      ctx.lineTo(-aw, -len / 2 + aw * 0.5);
      ctx.lineTo(aw, -len / 2 + aw * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  },
};

/**
 * Map NOAA condition strings to weather symbol IDs
 */
export const CONDITION_MAP = {
  'Fair':            null,
  'Clear':           null,
  'Partly Cloudy':   null,
  'Cloudy':          null,
  'Fog':             'fog',
  'Dense Fog':       'fog',
  'Rain':            'rain',
  'Light Rain':      'rain',
  'Heavy Rain':      'rain',
  'Thunderstorm':    'storm-warning',
  'Storm':           'storm-warning',
  'Gale Warning':    'storm-warning',
  'Small Craft Advisory': 'small-craft',
};
