// ─────────────────────────────────────────────────────────
//  DASCOLA — Tactical / Military Theme
//  CRT terminal, mil-spec symbology, green/amber monochrome
// ─────────────────────────────────────────────────────────

export const tactical = {
  id: 'tactical',
  name: 'Tactical',

  colors: {
    deep:      'rgba(2,6,4,1)',              // Near-black
    ouro:      'rgba(0,255,65,1)',            // Terminal green
    verde:     'rgba(0,200,50,1)',            // Bright green
    blade:     'rgba(0,180,60,0.7)',          // Dimmer green
    creme:     'rgba(0,255,65,0.8)',          // Green text
    land:      ['rgba(0,40,10,0.5)', 'rgba(0,50,15,0.4)', 'rgba(0,30,8,0.3)'],
    ocean:     ['rgba(0,25,8,0.3)', 'rgba(0,18,6,0.2)', 'rgba(0,10,3,0.1)'],
    fathom:    'rgba(0,120,30,0.1)',
    grid:      'rgba(0,255,65,0.06)',
    coastGlow: 'rgba(0,255,65,0.05)',
    coastLine: 'rgba(0,255,65,0.4)',
  },

  fonts: {
    display: '"Courier New", "Lucida Console", monospace',
    sans:    '"Courier New", "Lucida Console", monospace',
  },

  symbols: {
    vessel: {
      style: 'topdown',
      strokeWidth: 1.0,
      fillAlpha: 0.8,
      glowRadius: 20,
      trailStyle: 'line',
    },
    port: {
      shape: 'square',
      pulseSpeed: 3.0,
      labelStyle: 'uppercase',
    },
    buoy: {
      reflectionEnabled: false,
      bobAnimation: false,
    },
    weather: {
      iconStyle: 'outlined',
    },
  },

  emphasis: {
    vessel: 0.9,
    port:   1.0,
    marker: 0.9,
    icon:   0.9,
    text:   0.9,
  },

  atmosphere: {
    vignetteStrength: 0.8,
    noiseTexture: false,
    colorFilter: null,
    scanlines: true,
  },

  decorations: {
    compassRose: 'tactical',
    cartouche:   'none',
    borderStyle: 'scanline',
  },
};
