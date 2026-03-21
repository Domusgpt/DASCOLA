// ─────────────────────────────────────────────────────────
//  DASCOLA — Navigation Aid Symbols
//  Buoys, beacons, lighthouses, daymarks
// ─────────────────────────────────────────────────────────

export const NAV_AIDS = {
  'buoy-red': {
    name: 'Red Nun Buoy',
    draw(ctx, size, color) {
      const r = size * 0.4;
      // Pointed top (nun shape)
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.4);
      ctx.lineTo(-r, 0);
      ctx.quadraticCurveTo(-r, r, 0, r);
      ctx.quadraticCurveTo(r, r, r, 0);
      ctx.closePath();
      ctx.fillStyle = color || '#cc3333';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    },
  },

  'buoy-green': {
    name: 'Green Can Buoy',
    draw(ctx, size, color) {
      const r = size * 0.4;
      // Flat top (can shape)
      ctx.beginPath();
      ctx.rect(-r, -r, r * 2, r * 2);
      ctx.fillStyle = color || '#228b22';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    },
  },

  'buoy-yellow': {
    name: 'Special Purpose Buoy',
    draw(ctx, size, color) {
      const r = size * 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = color || '#daa520';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // X mark
      const s = r * 0.5;
      ctx.beginPath();
      ctx.moveTo(-s, -s); ctx.lineTo(s, s);
      ctx.moveTo(s, -s); ctx.lineTo(-s, s);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
  },

  'buoy-cardinal-n': {
    name: 'North Cardinal Mark',
    draw(ctx, size, color) {
      drawCardinal(ctx, size, 'N', color);
    },
  },
  'buoy-cardinal-s': {
    name: 'South Cardinal Mark',
    draw(ctx, size, color) {
      drawCardinal(ctx, size, 'S', color);
    },
  },
  'buoy-cardinal-e': {
    name: 'East Cardinal Mark',
    draw(ctx, size, color) {
      drawCardinal(ctx, size, 'E', color);
    },
  },
  'buoy-cardinal-w': {
    name: 'West Cardinal Mark',
    draw(ctx, size, color) {
      drawCardinal(ctx, size, 'W', color);
    },
  },

  'lighthouse': {
    name: 'Lighthouse',
    draw(ctx, size, color, t) {
      const h = size * 0.8, w = size * 0.3;
      // Tower
      ctx.beginPath();
      ctx.moveTo(-w, h * 0.4);
      ctx.lineTo(-w * 0.6, -h * 0.3);
      ctx.lineTo(w * 0.6, -h * 0.3);
      ctx.lineTo(w, h * 0.4);
      ctx.closePath();
      ctx.fillStyle = color || '#f5f5dc';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // Horizontal stripes
      ctx.fillStyle = 'rgba(200,50,50,0.6)';
      ctx.fillRect(-w * 0.85, h * 0.05, w * 1.7, h * 0.12);
      ctx.fillRect(-w * 0.7, -h * 0.2, w * 1.4, h * 0.1);
      // Light cap
      ctx.beginPath();
      ctx.arc(0, -h * 0.35, w * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe066';
      ctx.fill();
      // Light beam (animated)
      if (t != null) {
        const flash = Math.sin(t * 4) > 0.3;
        if (flash) {
          ctx.beginPath();
          ctx.moveTo(0, -h * 0.35);
          const beamLen = size * 2;
          const beamW = Math.PI * 0.12;
          const angle = t * 1.5;
          ctx.arc(0, -h * 0.35, beamLen, angle - beamW, angle + beamW);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255,224,102,0.08)';
          ctx.fill();
        }
      }
    },
  },

  'beacon': {
    name: 'Fixed Beacon',
    draw(ctx, size, color) {
      const h = size * 0.7;
      // Post
      ctx.beginPath();
      ctx.moveTo(0, h * 0.4);
      ctx.lineTo(0, -h * 0.3);
      ctx.strokeStyle = color || '#888';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Top mark — diamond
      const d = size * 0.25;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.3 - d);
      ctx.lineTo(-d * 0.7, -h * 0.3);
      ctx.lineTo(0, -h * 0.3 + d);
      ctx.lineTo(d * 0.7, -h * 0.3);
      ctx.closePath();
      ctx.fillStyle = color || '#888';
      ctx.fill();
    },
  },

  'daymark-triangle': {
    name: 'Triangular Daymark',
    draw(ctx, size, color) {
      const s = size * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(-s * 0.9, s * 0.6);
      ctx.lineTo(s * 0.9, s * 0.6);
      ctx.closePath();
      ctx.fillStyle = color || '#cc3333';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    },
  },

  'daymark-square': {
    name: 'Square Daymark',
    draw(ctx, size, color) {
      const s = size * 0.4;
      ctx.fillStyle = color || '#228b22';
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.7;
      ctx.strokeRect(-s, -s, s * 2, s * 2);
    },
  },
};

function drawCardinal(ctx, size, direction, color) {
  const r = size * 0.35;
  // Base
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#222';
  ctx.fill();

  // Top marks (two triangles pointing based on direction)
  const t = r * 0.5;
  ctx.fillStyle = color || '#daa520';
  if (direction === 'N') {
    drawArrow(ctx, 0, -r * 1.5, t, true);
    drawArrow(ctx, 0, -r * 2.2, t, true);
  } else if (direction === 'S') {
    drawArrow(ctx, 0, r * 1.5, t, false);
    drawArrow(ctx, 0, r * 2.2, t, false);
  } else if (direction === 'E') {
    drawArrow(ctx, 0, -r * 1.5, t, true);
    drawArrow(ctx, 0, -r * 2.2, t, false);
  } else {
    drawArrow(ctx, 0, -r * 1.5, t, false);
    drawArrow(ctx, 0, -r * 2.2, t, true);
  }

  // Yellow/black bands
  ctx.strokeStyle = '#daa520';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawArrow(ctx, x, y, size, up) {
  ctx.beginPath();
  if (up) {
    ctx.moveTo(x, y - size * 0.6);
    ctx.lineTo(x - size * 0.5, y + size * 0.4);
    ctx.lineTo(x + size * 0.5, y + size * 0.4);
  } else {
    ctx.moveTo(x, y + size * 0.6);
    ctx.lineTo(x - size * 0.5, y - size * 0.4);
    ctx.lineTo(x + size * 0.5, y - size * 0.4);
  }
  ctx.closePath();
  ctx.fill();
}
