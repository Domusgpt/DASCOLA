// ─────────────────────────────────────────────────────────
//  DASCOLA — Vessel Status & Info Overlay Symbols
// ─────────────────────────────────────────────────────────

export const STATUS = {
  'status-badge': {
    name: 'Status Pill Badge',
    draw(ctx, size, color, { label = '', bgColor = null } = {}) {
      if (!label) return;
      ctx.font = `bold ${Math.round(size * 0.55)}px sans-serif`;
      const tw = ctx.measureText(label).width;
      const pw = tw + size * 0.6;
      const ph = size * 0.7;
      const r = ph / 2;

      // Pill background
      ctx.beginPath();
      ctx.moveTo(-pw / 2 + r, -ph / 2);
      ctx.lineTo(pw / 2 - r, -ph / 2);
      ctx.arc(pw / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-pw / 2 + r, ph / 2);
      ctx.arc(-pw / 2 + r, 0, r, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = bgColor || color || 'rgba(0,0,0,0.5)';
      ctx.fill();

      // Label text
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
    },
  },

  'catch-tag': {
    name: 'Catch Species Indicator',
    draw(ctx, size, color, { species = '', weight = 0 } = {}) {
      if (!species) return;
      const label = weight ? `${species} ${weight}lb` : species;
      ctx.font = `${Math.round(size * 0.45)}px sans-serif`;
      const tw = ctx.measureText(label).width;
      const pw = tw + size * 0.4;
      const ph = size * 0.55;

      ctx.fillStyle = color || 'rgba(0,104,71,0.6)';
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
    },
  },

  'eta-display': {
    name: 'ETA to Port Readout',
    draw(ctx, size, color, { eta = '', port = '' } = {}) {
      if (!eta) return;
      const label = port ? `ETA ${port}: ${eta}` : `ETA: ${eta}`;
      ctx.font = `${Math.round(size * 0.45)}px sans-serif`;
      ctx.fillStyle = color || 'rgba(139,175,196,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
    },
  },

  'speed-indicator': {
    name: 'Speed Arc Gauge',
    draw(ctx, size, color, { speed = 0, maxSpeed = 15 } = {}) {
      const r = size * 0.4;
      const ratio = Math.min(speed / maxSpeed, 1);
      const startAngle = Math.PI * 0.75;
      const endAngle = startAngle + ratio * Math.PI * 1.5;

      // Background arc
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.75, Math.PI * 2.25);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Speed arc
      ctx.beginPath();
      ctx.arc(0, 0, r, startAngle, endAngle);
      ctx.strokeStyle = color || '#c9a84c';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Speed text
      ctx.fillStyle = color || '#c9a84c';
      ctx.font = `bold ${Math.round(size * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${speed.toFixed(1)}kt`, 0, r * 0.3);
    },
  },

  'captains-log': {
    name: "Captain's Log Icon",
    draw(ctx, size, color) {
      const s = size * 0.35;
      // Book / scroll
      ctx.strokeStyle = color || '#c9a84c';
      ctx.lineWidth = 1;
      ctx.strokeRect(-s, -s * 0.8, s * 2, s * 1.6);
      // Lines
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 3; i++) {
        const y = -s * 0.4 + i * s * 0.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, y);
        ctx.lineTo(s * 0.6, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  },

  'permission-lock': {
    name: 'Permission Lock Icon',
    draw(ctx, size, color) {
      const s = size * 0.25;
      // Lock body
      ctx.fillStyle = color || '#888';
      ctx.fillRect(-s, 0, s * 2, s * 1.5);
      // Shackle
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, Math.PI, 0);
      ctx.strokeStyle = color || '#888';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
  },
};
