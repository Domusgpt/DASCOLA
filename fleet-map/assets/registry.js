// ─────────────────────────────────────────────────────────
//  DASCOLA — Asset Registry
//  Central registry for all symbols and themes
// ─────────────────────────────────────────────────────────

import { VESSELS } from './symbols/vessels.js';
import { NAV_AIDS } from './symbols/nav-aids.js';
import { CHANNEL_MARKERS } from './symbols/channel-markers.js';
import { PORTS } from './symbols/ports.js';
import { WEATHER } from './symbols/weather.js';
import { CARTOGRAPHY } from './symbols/cartography.js';
import { STATUS } from './symbols/status.js';
import { mergeTheme } from './themes/theme.js';
import { classicNautical } from './themes/classic-nautical.js';
import { treasureMap } from './themes/treasure-map.js';
import { tactical } from './themes/tactical.js';
import { minimal } from './themes/minimal.js';
import { tropical } from './themes/tropical.js';

export class AssetRegistry {
  constructor() {
    this.symbols = {};
    this.categories = {};
    this.themes = {};
  }

  /**
   * Register a set of symbols under a category
   */
  registerSymbols(category, symbols) {
    this.categories[category] = this.categories[category] || [];
    for (const [id, def] of Object.entries(symbols)) {
      this.symbols[id] = { ...def, category };
      this.categories[category].push(id);
    }
  }

  /**
   * Register a theme (merges with defaults)
   */
  registerTheme(themePartial) {
    const theme = mergeTheme(themePartial);
    this.themes[theme.id] = theme;
  }

  /**
   * Get a symbol definition by ID
   */
  getSymbol(id) {
    return this.symbols[id] || null;
  }

  /**
   * Get a theme by ID (falls back to classic-nautical)
   */
  getTheme(id) {
    return this.themes[id] || this.themes['classic-nautical'] || null;
  }

  /**
   * List all symbol IDs in a category
   */
  listSymbols(category) {
    return this.categories[category] || [];
  }

  /**
   * List all registered theme IDs
   */
  listThemes() {
    return Object.keys(this.themes);
  }
}

/**
 * Create a fully-loaded registry with all built-in assets
 */
export function createDefaultRegistry() {
  const reg = new AssetRegistry();

  reg.registerSymbols('vessel', VESSELS);
  reg.registerSymbols('nav-aid', NAV_AIDS);
  reg.registerSymbols('channel-marker', CHANNEL_MARKERS);
  reg.registerSymbols('port', PORTS);
  reg.registerSymbols('weather', WEATHER);
  reg.registerSymbols('cartography', CARTOGRAPHY);
  reg.registerSymbols('status', STATUS);

  reg.registerTheme(classicNautical);
  reg.registerTheme(treasureMap);
  reg.registerTheme(tactical);
  reg.registerTheme(minimal);
  reg.registerTheme(tropical);

  return reg;
}
