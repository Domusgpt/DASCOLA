// ─────────────────────────────────────────────────────────
//  DASCOLA — Base Theme Interface
//  All themes extend this structure
// ─────────────────────────────────────────────────────────

/**
 * Default theme values — any theme property not explicitly set
 * falls back to these defaults.
 */
export const THEME_DEFAULTS = {
  id: 'base',
  name: 'Base Theme',

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
      style: 'topdown',       // 'topdown' | 'profile' | 'icon'
      strokeWidth: 0.7,
      fillAlpha: 0.85,
      glowRadius: 32,
      trailStyle: 'line',     // 'line' | 'dotted' | 'none'
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
      iconStyle: 'outlined',  // 'filled' | 'outlined' | 'hand-drawn'
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

/**
 * Deep merge a theme definition with defaults
 */
export function mergeTheme(themePartial) {
  const merged = { ...THEME_DEFAULTS };
  if (!themePartial) return merged;

  for (const key of Object.keys(themePartial)) {
    if (themePartial[key] && typeof themePartial[key] === 'object' && !Array.isArray(themePartial[key])) {
      merged[key] = { ...(THEME_DEFAULTS[key] || {}), ...themePartial[key] };
    } else {
      merged[key] = themePartial[key];
    }
  }
  return merged;
}
