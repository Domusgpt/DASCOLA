// ─────────────────────────────────────────────────────────
//  DASCOLA — Classic Nautical Theme
//  Refined gold/deep-blue aesthetic — the default look
// ─────────────────────────────────────────────────────────

export const classicNautical = {
  id: 'classic-nautical',
  name: 'Classic Nautical',

  colors: {
    deep:      'rgba(4,10,16,1)',
    ouro:      'rgba(201,168,76,1)',
    verde:     'rgba(0,104,71,1)',
    blade:     'rgba(139,175,196,1)',
    creme:     'rgba(240,235,224,1)',
    land:      ['rgba(0,42,31,0.6)', 'rgba(0,59,46,0.5)', 'rgba(0,42,31,0.4)'],
    ocean:     ['rgba(13,34,64,0.35)', 'rgba(10,28,50,0.2)', 'rgba(4,10,16,0.05)'],
    fathom:    'rgba(27,58,92,0.12)',
    grid:      'rgba(201,168,76,0.04)',
    coastGlow: 'rgba(201,168,76,0.08)',
    coastLine: 'rgba(201,168,76,0.35)',
  },

  fonts: {
    display: '"Playfair Display", Georgia, serif',
    sans:    '"Josefin Sans", sans-serif',
  },

  symbols: {
    vessel: {
      style: 'profile',
      strokeWidth: 0.7,
      fillAlpha: 0.85,
      glowRadius: 32,
      trailStyle: 'line',
    },
    port: {
      shape: 'circle',
      pulseSpeed: 2.5,
      labelStyle: 'uppercase',
    },
    buoy: {
      reflectionEnabled: false,
      bobAnimation: true,
    },
    weather: {
      iconStyle: 'outlined',
    },
  },

  emphasis: {
    vessel: 1.0,
    port:   1.5,
    marker: 1.0,
    icon:   1.0,
    text:   1.0,
  },

  atmosphere: {
    vignetteStrength: 1.0,
    noiseTexture: false,
    colorFilter: null,
  },

  decorations: {
    compassRose: 'classic',
    cartouche:   'bordered',
    borderStyle: 'double-line',
  },
};
