// ─────────────────────────────────────────────────────────
//  DASCOLA — IALA Channel Marking System (Region B — Americas)
// ─────────────────────────────────────────────────────────

export const CHANNEL_MARKERS = {
  'lateral-port': {
    name: 'Port-Side Marker',
    color: '#cc3333',
    draw(ctx, size, themeColor) {
      const r = size * 0.4;
      // Nun buoy (conical)
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.3);
      ctx.lineTo(-r * 0.8, r * 0.3);
      ctx.quadraticCurveTo(-r * 0.5, r, 0, r);
      ctx.quadraticCurveTo(r * 0.5, r, r * 0.8, r * 0.3);
      ctx.closePath();
      ctx.fillStyle = themeColor || this.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      // Number
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(size * 0.3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2', 0, 0);
    },
  },

  'lateral-starboard': {
    name: 'Starboard-Side Marker',
    color: '#228b22',
    draw(ctx, size, themeColor) {
      const r = size * 0.4;
      // Can buoy (flat top)
      ctx.beginPath();
      ctx.rect(-r * 0.8, -r, r * 1.6, r * 2);
      ctx.fillStyle = themeColor || this.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(size * 0.3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1', 0, 0);
    },
  },

  'safe-water': {
    name: 'Safe Water Mark',
    color: '#cc3333',
    draw(ctx, size) {
      const r = size * 0.4;
      // Red and white vertical stripes
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      // Red stripes
      ctx.fillStyle = '#cc3333';
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, angle, angle + Math.PI / 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    },
  },

  'isolated-danger': {
    name: 'Isolated Danger Mark',
    draw(ctx, size) {
      const r = size * 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#222';
      ctx.fill();
      // Red band
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#cc3333';
      ctx.lineWidth = r * 0.4;
      ctx.stroke();
      // Two sphere topmarks
      const ts = r * 0.3;
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(0, -r * 1.4, ts, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -r * 2.1, ts, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  'special': {
    name: 'Special Purpose Mark',
    draw(ctx, size) {
      const r = size * 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#daa520';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      // X topmark
      const s = r * 0.5;
      ctx.beginPath();
      ctx.moveTo(-s, -s); ctx.lineTo(s, s);
      ctx.moveTo(s, -s); ctx.lineTo(-s, s);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
  },
};
