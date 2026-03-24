/**
 * Fleet Map — D'Ascola Seafood Premium Theme
 * =============================================
 * A luxurious deep-ocean aesthetic with warm amber gold accents,
 * rich midnight navy depths, and seafoam highlights. Designed
 * to evoke the prestige of a world-class fishing fleet.
 *
 * Palette:
 *   - Deep midnight navy (#030810) — the abyss
 *   - Warm amber gold (#D4A54A) — D'Ascola brand accent
 *   - Rich teal (#0A7E6E) — vibrant port/land
 *   - Seafoam silver (#9CC5C9) — transit/secondary
 *   - Antique cream (#F5EDD8) — text highlights
 *
 * Vessel style: profile (elegant side-view silhouettes)
 */

import { createTheme } from './theme.js';

export var DASCOLA = createTheme('dascola', "D'Ascola Seafood", {
  colors: {
    deep:      'rgba(3,8,16,1)',               // Midnight navy
    ouro:      'rgba(212,165,74,1)',            // Warm amber gold
    verde:     'rgba(10,126,110,1)',            // Rich teal
    blade:     'rgba(156,197,201,1)',           // Seafoam silver
    creme:     'rgba(245,237,216,1)',           // Antique cream
    land:      ['rgba(6,52,45,0.7)', 'rgba(10,75,62,0.55)', 'rgba(6,52,45,0.4)'],
    ocean:     ['rgba(8,28,58,0.4)', 'rgba(6,22,45,0.25)', 'rgba(3,8,16,0.05)'],
    fathom:    'rgba(20,55,88,0.14)',
    grid:      'rgba(212,165,74,0.035)',
    coastGlow: 'rgba(212,165,74,0.12)',
    coastLine: 'rgba(212,165,74,0.45)',
  },

  fonts: {
    display: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
    sans:    '"Josefin Sans", "Lato", sans-serif',
  },

  symbols: {
    vessel: {
      style: 'profile',
      strokeWidth: 0.6,
      fillAlpha: 0.92,
      glowRadius: 40,
      trailStyle: 'line',
    },
    port: {
      shape: 'dock',
      pulseSpeed: 2.0,
      labelStyle: 'upper',
    },
    buoy: {
      bobAnimation: true,
      reflectionEnabled: false,
    },
    weather: {
      iconStyle: 'filled',
    },
  },

  emphasis: {
    vessel:  1.1,
    port:    1.6,
    marker:  1.1,
    icon:    1.1,
    text:    1.05,
    compass: 1.2,
  },

  atmosphere: {
    vignetteStrength: 0.7,
    noiseTexture: true,
    colorFilter: null,
  },

  decorations: {
    compassRose: 'ornate',
    cartouche: 'bordered',
    borderStyle: 'double-line',
    seaMonsters: false,
  },
});
