// ─────────────────────────────────────────────────────────
//  DASCOLA — Tropical Theme
//  Bright, playful, island vibes
// ─────────────────────────────────────────────────────────

export const tropical = {
  id: 'tropical',
  name: 'Tropical',

  colors: {
    deep:      'rgba(0,90,140,1)',           // Ocean blue
    ouro:      'rgba(255,183,77,1)',          // Sunset orange
    verde:     'rgba(0,180,120,1)',           // Bright teal
    blade:     'rgba(72,202,228,1)',          // Cyan
    creme:     'rgba(255,255,255,1)',         // White
    land:      ['rgba(76,175,80,0.6)', 'rgba(102,187,106,0.5)', 'rgba(129,199,132,0.4)'],
    ocean:     ['rgba(0,105,165,0.3)', 'rgba(0,85,140,0.2)', 'rgba(0,70,120,0.1)'],
    fathom:    'rgba(72,202,228,0.12)',
    grid:      'rgba(255,255,255,0.05)',
    coastGlow: 'rgba(255,183,77,0.1)',
    coastLine: 'rgba(255,183,77,0.4)',
  },

  fonts: {
    display: '"Pacifico", "Comic Sans MS", cursive',
    sans:    '"Nunito", "Josefin Sans", sans-serif',
  },

  symbols: {
    vessel: {
      style: 'icon',
      strokeWidth: 0.8,
      fillAlpha: 0.9,
      glowRadius: 24,
      trailStyle: 'dotted',
    },
    port: {
      shape: 'circle',
      pulseSpeed: 2.0,
      labelStyle: 'capitalize',
    },
    buoy: {
      reflectionEnabled: true,
      bobAnimation: true,
    },
    weather: {
      iconStyle: 'filled',
    },
  },

  emphasis: {
    vessel: 1.1,
    port:   1.8,
    marker: 1.1,
    icon:   1.2,
    text:   1.0,
  },

  atmosphere: {
    vignetteStrength: 0.5,
    noiseTexture: false,
    colorFilter: null,
  },

  decorations: {
    compassRose: 'minimal',
    cartouche:   'ribbon',
    borderStyle: 'none',
  },
};
