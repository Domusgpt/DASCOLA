// ─────────────────────────────────────────────────────────
//  DASCOLA — Port & Harbor Facility Symbols
// ─────────────────────────────────────────────────────────

export const PORTS = {
  dock: {
    name: 'Dock / Wharf',
    draw(ctx, size, color) {
      const w = size * 0.6, h = size * 0.4;
      ctx.fillStyle = color || '#6b8e6b';
      // Main pier
      ctx.fillRect(-w / 2, -h / 2, w, h);
      // Pilings
      const ps = size * 0.08;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-w / 2 - ps, -h * 0.3, ps * 2, h * 0.6);
      ctx.fillRect(w / 2 - ps, -h * 0.3, ps * 2, h * 0.6);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    },
  },

  mooring: {
    name: 'Mooring Buoy',
    draw(ctx, size, color) {
      const r = size * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = color || '#fff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Ring on top
      ctx.beginPath();
      ctx.arc(0, -r * 0.3, r * 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = color || '#888';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
  },

  fuel: {
    name: 'Fuel Station',
    draw(ctx, size, color) {
      const s = size * 0.35;
      // Pump body
      ctx.fillStyle = color || '#b44';
      ctx.fillRect(-s, -s, s * 1.5, s * 2);
      // Nozzle
      ctx.beginPath();
      ctx.moveTo(s * 0.5, -s * 0.5);
      ctx.lineTo(s * 1.1, -s * 0.8);
      ctx.lineTo(s * 1.1, -s * 0.2);
      ctx.strokeStyle = color || '#b44';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // F label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(size * 0.3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('F', -s * 0.25, 0);
    },
  },

  'ice-house': {
    name: 'Ice Supply',
    draw(ctx, size, color) {
      const s = size * 0.35;
      ctx.fillStyle = color || '#6ba3be';
      ctx.fillRect(-s, -s, s * 2, s * 2);
      // Snowflake / crystal
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      const r = s * 0.6;
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(-Math.cos(a) * r, -Math.sin(a) * r);
        ctx.stroke();
      }
    },
  },

  'fish-market': {
    name: 'Fish Market / Auction',
    draw(ctx, size, color) {
      const s = size * 0.4;
      // Building
      ctx.fillStyle = color || '#8b7355';
      ctx.fillRect(-s, -s * 0.5, s * 2, s * 1.5);
      // Roof
      ctx.beginPath();
      ctx.moveTo(-s * 1.1, -s * 0.5);
      ctx.lineTo(0, -s * 1.2);
      ctx.lineTo(s * 1.1, -s * 0.5);
      ctx.closePath();
      ctx.fillStyle = color || '#8b7355';
      ctx.fill();
      // Fish symbol
      ctx.beginPath();
      ctx.ellipse(0, s * 0.2, s * 0.5, s * 0.25, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();
    },
  },

  'boat-ramp': {
    name: 'Launch Ramp',
    draw(ctx, size, color) {
      const w = size * 0.5, h = size * 0.6;
      // Ramp
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, -h * 0.3);
      ctx.lineTo(-w * 0.8, h * 0.5);
      ctx.lineTo(w * 0.8, h * 0.5);
      ctx.lineTo(w * 0.5, -h * 0.3);
      ctx.closePath();
      ctx.fillStyle = color || '#999';
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    },
  },

  'harbor-master': {
    name: 'Harbor Master Office',
    draw(ctx, size, color) {
      const s = size * 0.35;
      // Building
      ctx.fillStyle = color || '#4a6fa5';
      ctx.fillRect(-s, -s * 0.4, s * 2, s * 1.4);
      // Roof
      ctx.beginPath();
      ctx.moveTo(-s * 1.1, -s * 0.4);
      ctx.lineTo(0, -s * 1.1);
      ctx.lineTo(s * 1.1, -s * 0.4);
      ctx.closePath();
      ctx.fill();
      // Anchor symbol
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.3, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.2);
      ctx.lineTo(0, s * 0.5);
      ctx.stroke();
    },
  },

  anchorage: {
    name: 'Anchorage Area',
    draw(ctx, size, color) {
      const r = size * 0.4;
      // Anchor symbol
      ctx.strokeStyle = color || '#c9a84c';
      ctx.lineWidth = 1.5;
      // Ring at top
      ctx.beginPath();
      ctx.arc(0, -r * 0.8, r * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      // Shank
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.4);
      ctx.stroke();
      // Cross bar
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.15);
      ctx.lineTo(r * 0.5, -r * 0.15);
      ctx.stroke();
      // Flukes
      ctx.beginPath();
      ctx.arc(0, r * 0.4, r * 0.6, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    },
  },
};
