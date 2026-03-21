// ─────────────────────────────────────────────────────────
//  DASCOLA — Minimal Theme
//  Clean, flat, modern design with muted palette
// ─────────────────────────────────────────────────────────

export const minimal = {
  id: 'minimal',
  name: 'Minimal',

  colors: {
    deep:      'rgba(245,245,248,1)',        // Light gray background
    ouro:      'rgba(55,65,81,1)',            // Dark gray accent
    verde:     'rgba(34,150,110,1)',          // Teal
    blade:     'rgba(100,116,139,1)',         // Slate
    creme:     'rgba(30,41,59,1)',            // Near-black text
    land:      ['rgba(226,232,240,0.8)', 'rgba(236,240,245,0.7)', 'rgba(241,245,249,0.6)'],
    ocean:     ['rgba(219,234,254,0.3)', 'rgba(224,238,255,0.2)', 'rgba(240,249,255,0.1)'],
    fathom:    'rgba(148,163,184,0.1)',
    grid:      'rgba(148,163,184,0.08)',
    coastGlow: 'rgba(148,163,184,0.05)',
    coastLine: 'rgba(100,116,139,0.3)',
  },

  fonts: {
    display: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    sans:    '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  symbols: {
    vessel: {
      style: 'topdown',
      strokeWidth: 0.5,
      fillAlpha: 0.75,
      glowRadius: 16,
      trailStyle: 'line',
    },
    port: {
      shape: 'circle',
      pulseSpeed: 2.0,
      labelStyle: 'capitalize',
    },
    buoy: {
      reflectionEnabled: false,
      bobAnimation: false,
    },
    weather: {
      iconStyle: 'filled',
    },
  },

  emphasis: {
    vessel: 0.85,
    port:   1.0,
    marker: 0.85,
    icon:   0.9,
    text:   0.9,
  },

  atmosphere: {
    vignetteStrength: 0.3,
    noiseTexture: false,
    colorFilter: null,
  },

  decorations: {
    compassRose: 'minimal',
    cartouche:   'none',
    borderStyle: 'none',
  },
};
