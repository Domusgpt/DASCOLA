// ─────────────────────────────────────────────────────────
//  DASCOLA — Treasure Map Theme
//  Parchment, hand-drawn, sea monsters, aged aesthetic
// ─────────────────────────────────────────────────────────

export const treasureMap = {
  id: 'treasure-map',
  name: 'Treasure Map',

  colors: {
    deep:      'rgba(180,155,110,1)',        // Parchment tan
    ouro:      'rgba(120,75,30,1)',           // Dark ink brown
    verde:     'rgba(85,110,65,1)',           // Faded green
    blade:     'rgba(100,85,70,1)',           // Muted brown
    creme:     'rgba(60,40,25,1)',            // Dark ink
    land:      ['rgba(160,135,95,0.7)', 'rgba(145,125,90,0.6)', 'rgba(130,115,85,0.5)'],
    ocean:     ['rgba(155,140,110,0.3)', 'rgba(165,148,118,0.2)', 'rgba(175,158,128,0.1)'],
    fathom:    'rgba(100,80,55,0.12)',
    grid:      'rgba(120,75,30,0.06)',
    coastGlow: 'rgba(120,75,30,0.1)',
    coastLine: 'rgba(80,55,30,0.5)',
  },

  fonts: {
    display: '"IM Fell English", "Playfair Display", Georgia, serif',
    sans:    '"IM Fell English", Georgia, serif',
  },

  symbols: {
    vessel: {
      style: 'profile',
      strokeWidth: 1.2,
      fillAlpha: 0.75,
      glowRadius: 20,
      trailStyle: 'dotted',
    },
    port: {
      shape: 'circle',
      pulseSpeed: 1.5,
      labelStyle: 'uppercase',
    },
    buoy: {
      reflectionEnabled: false,
      bobAnimation: false,
    },
    weather: {
      iconStyle: 'hand-drawn',
    },
  },

  emphasis: {
    vessel: 1.2,
    port:   2.0,
    marker: 1.3,
    icon:   1.2,
    text:   1.1,
  },

  atmosphere: {
    vignetteStrength: 1.5,
    noiseTexture: true,
    colorFilter: 'sepia',
  },

  decorations: {
    compassRose: 'ornate',
    cartouche:   'scroll',
    borderStyle: 'rope',
  },
};
