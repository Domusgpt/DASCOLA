/**
 * Viking Village Fleet Map — Default Configuration
 * Override any of these when instantiating FleetMap.
 *
 * Color palette inspired by:
 *   - Barnegat Lighthouse: red (#C41E3A) and white bands
 *   - Turquoise green ocean: #3BA99C
 *   - Sand dunes: #D4B896
 *   - Night indigo ocean: #0F1B3D
 *   - Pine Barrens green: #3A6B35
 */

export var DEFAULTS = {
  // Company branding
  title: 'Viking Village',
  subtitle: 'Est. 1927 · Barnegat Light, NJ',

  // Map geographic bounds
  // North end of LBI on left, Atlantic fishing grounds filling most of map
  // Extends east to Hudson Canyon area (~72°W)
  bounds: { latN: 40.8, latS: 38.8, lonW: -74.35, lonE: -71.2 },

  // Performance
  particleCount: 250,
  particleCountMobile: 100,
  trailLength: 20,
  mobileBreakpoint: 900,

  // AIS integration
  aisEndpoint: null,
  aisRefreshMs: 60000,

  // Color palette — Barnegat Lighthouse inspired
  colors: {
    // Deep indigo ocean — night sky meets deep water
    deep:      'rgba(15,27,61,1)',
    // Lighthouse red — accent for fishing vessels and highlights
    ouro:      'rgba(196,30,58,1)',
    // Pine Barrens green — land, ports, in-port status
    verde:     'rgba(58,107,53,1)',
    // Turquoise — ocean currents, secondary text, transit status
    blade:     'rgba(59,169,156,1)',
    // Sand — light text color, warm beach tones
    creme:     'rgba(212,184,150,1)',
    // Land fill gradient — pine/dune tones
    land:      ['rgba(42,71,38,0.7)', 'rgba(58,107,53,0.5)', 'rgba(72,95,52,0.4)'],
    // Ocean gradient — deep indigo to lighter shelf waters
    ocean:     ['rgba(15,35,70,0.35)', 'rgba(12,28,55,0.2)', 'rgba(15,27,61,0.05)'],
    // Fathom contour lines — subtle turquoise
    fathom:    'rgba(59,169,156,0.12)',
    // Grid — faint sand-colored
    grid:      'rgba(212,184,150,0.04)',
    // Coast glow — warm lighthouse beam
    coastGlow: 'rgba(196,30,58,0.06)',
    // Coast line — lighthouse red, subtle
    coastLine: 'rgba(196,30,58,0.3)',
  },

  // Fonts (must be loaded by the host page)
  fonts: {
    display: '"Playfair Display", Georgia, serif',
    sans:    '"Josefin Sans", sans-serif',
  },

  // Vessels — array of vessel objects
  vessels: [],

  // Ports — array of port objects
  ports: [],

  // Shipping routes — array of route arrays
  routes: [],

  // Coast data key
  coastData: 'lbi',

  // Current flow definitions
  currentData: 'nj-atlantic',

  // Barnegat Lighthouse position (used for compass rose)
  lighthouse: { lat: 39.7644, lon: -74.1061 },

  // Callbacks
  onVesselHover: null,
  onVesselClick: null,
  onAISUpdate: null,
};

/**
 * Merge user config with defaults (shallow + nested colors/fonts).
 */
export function mergeConfig(userConfig) {
  var cfg = {};
  var key;
  for (key in DEFAULTS) {
    if (DEFAULTS.hasOwnProperty(key)) {
      cfg[key] = DEFAULTS[key];
    }
  }
  if (!userConfig) return cfg;
  for (key in userConfig) {
    if (!userConfig.hasOwnProperty(key)) continue;
    if (key === 'colors' || key === 'fonts') {
      cfg[key] = {};
      var def = DEFAULTS[key];
      var usr = userConfig[key] || {};
      for (var k in def) { if (def.hasOwnProperty(k)) cfg[key][k] = def[k]; }
      for (var k2 in usr) { if (usr.hasOwnProperty(k2)) cfg[key][k2] = usr[k2]; }
    } else {
      cfg[key] = userConfig[key];
    }
  }
  return cfg;
}
