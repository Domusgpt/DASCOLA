/**
 * Fleet Map — Main Entry Point
 * =============================
 * A reusable, configurable fleet tracking map for the fishing industry.
 * Now with asset design system: themed vessel silhouettes, weather overlay,
 * channel markers, and 5 switchable theme packs.
 *
 * Usage:
 *   import { FleetMap } from './fleet-map/index.js';
 *
 *   var map = new FleetMap('#fleetMap', {
 *     title: 'My Fleet',
 *     theme: 'classic-nautical',  // or 'tactical', 'treasure-map', 'minimal', 'tropical'
 *     assets: { vesselStyle: 'silhouette', showWeather: true },
 *     bounds: { latN: -15, latS: -35, lonW: -55, lonE: -25 },
 *     vessels: [ { name: 'Boat 1', lat: -24, lon: -44, heading: 135, speed: 7, type: 'Longliner', status: 'Fishing', catch: 'Swordfish' } ],
 *     ports: [ { name: 'Santos', lat: -23.96, lon: -46.33, size: 'major', facilities: ['fuel', 'ice-house'] } ],
 *     routes: [ { name: 'US East Coast', points: [[-23.96,-46.33],[-22,-42],[5,-40],[40.7,-74]] } ],
 *     weather: { enabled: true, stations: [{ lat: -23.96, lon: -46.33, name: 'Santos' }] },
 *     markers: [{ type: 'buoy-red', lat: -24.0, lon: -44.5, name: 'R2' }],
 *   });
 *
 *   map.start();
 */

import { mergeConfig } from './config.js';
import { CanvasManager } from './core.js';
import { drawDepth } from './layers/depth.js';
import { drawCurrents, initParticles } from './layers/currents.js';
import { drawCoast } from './layers/coast.js';
import { drawVessels } from './layers/vessels.js';
import { drawAtmosphere } from './layers/atmosphere.js';
import { drawWeather } from './layers/weather.js';
import { drawMarkers } from './layers/markers.js';
import { buildRoster } from './roster.js';
import { setupInteraction } from './interaction.js';
import { AISClient } from './ais.js';
import { BRAZIL_COAST } from './data/brazil-coast.js';
import { SA_CURRENTS } from './data/currents-sa.js';
import { createDefaultRegistry } from './assets/registry.js';
import { AssetRenderer } from './assets/renderer.js';
import { NOAAClient } from './services/noaa.js';

/**
 * Deep-copy an array of plain objects (one level deep).
 */
function cloneArray(arr) {
  if (!arr) return [];
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    var copy = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        copy[k] = obj[k];
      }
    }
    out.push(copy);
  }
  return out;
}

/**
 * Ensure each vessel in the array has a trail and screen-position fields.
 */
function prepareVessels(vessels) {
  for (var i = 0; i < vessels.length; i++) {
    var v = vessels[i];
    if (!v.trail) v.trail = [];
    if (v._sx === undefined) v._sx = 0;
    if (v._sy === undefined) v._sy = 0;
  }
  return vessels;
}

export class FleetMap {
  /**
   * @param {string|HTMLElement} selector — CSS selector or DOM element for the .fleet-map container
   * @param {object} userConfig — configuration overrides (see config.js for defaults)
   */
  constructor(selector, userConfig) {
    // Merge user config with defaults
    this.config = mergeConfig(userConfig);

    // Resolve container element
    if (typeof selector === 'string') {
      this.container = document.querySelector(selector);
    } else {
      this.container = selector;
    }
    if (!this.container) {
      throw new Error('FleetMap: container not found — ' + selector);
    }

    // Deep copy vessel, port, and route data so we don't mutate originals
    this.vessels = prepareVessels(cloneArray(this.config.vessels));
    this.ports = cloneArray(this.config.ports);
    this.routes = cloneArray(this.config.routes);
    this.markers = cloneArray(this.config.markers);

    // Resolve coast data
    if (this.config.coastData === 'brazil') {
      this.coastData = BRAZIL_COAST;
    } else if (Array.isArray(this.config.coastData)) {
      this.coastData = this.config.coastData;
    } else {
      this.coastData = [];
    }

    // Resolve current flow data
    if (this.config.currentData === 'south-atlantic') {
      this.currentData = SA_CURRENTS;
    } else if (Array.isArray(this.config.currentData)) {
      this.currentData = this.config.currentData;
    } else {
      this.currentData = [];
    }

    // Create canvas manager (now with weather + markers layers)
    this.cm = new CanvasManager(this.container, this.config);

    // ── Asset Design System ──────────────────────────
    this.registry = createDefaultRegistry();
    this.renderer = new AssetRenderer(this.registry, this.config.theme);

    // Apply theme colors to config so all layers use the theme palette
    var theme = this.registry.getTheme(this.config.theme);
    if (theme && theme.colors) {
      for (var ck in theme.colors) {
        if (theme.colors.hasOwnProperty(ck)) {
          this.config.colors[ck] = theme.colors[ck];
        }
      }
    }
    if (theme && theme.fonts) {
      for (var fk in theme.fonts) {
        if (theme.fonts.hasOwnProperty(fk)) {
          this.config.fonts[fk] = theme.fonts[fk];
        }
      }
    }

    // ── NOAA Weather Client ──────────────────────────
    this.noaaClient = null;
    this.weatherData = [];
    this.weatherWarnings = [];
    if (this.config.weather && this.config.weather.enabled) {
      this.noaaClient = new NOAAClient(this.config.weather);
    }

    // Init current particles
    this.particles = initParticles(this.config);

    // Build roster panel
    this.rosterEl = buildRoster(this.container, this.vessels, this.config);

    // Setup mouse/touch interaction
    this._interactionCleanup = setupInteraction(this.cm, this.vessels, this.config);

    // AIS live-tracking client
    this.aisClient = null;
    if (this.config.aisEndpoint) {
      this.aisClient = new AISClient(this.config.aisEndpoint, this.config.aisRefreshMs);
    }

    // State
    this.started = false;
    this._resizeBound = this.resize.bind(this);
  }

  /**
   * Begin rendering and (optionally) AIS/weather polling.
   */
  start() {
    if (this.started) return;
    this.started = true;

    // Draw static layers once
    this._drawStatic();

    // Start the animation loop
    var self = this;
    this.cm.startLoop(function (t) {
      self._draw(t);
    });

    // Start AIS polling if configured
    if (this.aisClient) {
      var self2 = this;
      this.aisClient.start(function (updatedVessels) {
        self2.updateVessels(updatedVessels);
      });
    }

    // Start NOAA weather polling if configured
    if (this.noaaClient) {
      var self3 = this;
      this.noaaClient.start(function (data, warnings) {
        self3.weatherData = data || [];
        self3.weatherWarnings = warnings || [];
        self3.cm.markDirty('weather');
        if (typeof self3.config.onWeatherUpdate === 'function') {
          self3.config.onWeatherUpdate(data, warnings);
        }
      });
    }

    // Listen for window resize
    window.addEventListener('resize', this._resizeBound);
  }

  /**
   * Pause rendering and AIS/weather polling.
   */
  stop() {
    if (!this.started) return;
    this.started = false;

    this.cm.stopLoop();

    if (this.aisClient) {
      this.aisClient.stop();
    }

    if (this.noaaClient) {
      this.noaaClient.stop();
    }
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this.stop();

    window.removeEventListener('resize', this._resizeBound);

    if (this._interactionCleanup) {
      this._interactionCleanup();
      this._interactionCleanup = null;
    }

    if (this.cm) {
      this.cm.destroy();
      this.cm = null;
    }

    if (this.aisClient) {
      this.aisClient.stop();
      this.aisClient = null;
    }

    if (this.noaaClient) {
      this.noaaClient.stop();
      this.noaaClient = null;
    }

    this.vessels = null;
    this.ports = null;
    this.routes = null;
    this.markers = null;
    this.coastData = null;
    this.currentData = null;
    this.particles = null;
    this.rosterEl = null;
    this.container = null;
    this.config = null;
    this.registry = null;
    this.renderer = null;
    this.weatherData = null;
    this.weatherWarnings = null;
  }

  /**
   * Replace the vessel list. Rebuilds the roster and updates stats.
   */
  updateVessels(arr) {
    this.vessels = prepareVessels(cloneArray(arr));

    if (this.container && this.config) {
      this.rosterEl = buildRoster(this.container, this.vessels, this.config);
    }

    this._updateStats();

    if (this.config && typeof this.config.onAISUpdate === 'function') {
      this.config.onAISUpdate(this.vessels);
    }
  }

  /**
   * Switch theme at runtime.
   * @param {string} themeId — 'classic-nautical' | 'tactical' | 'treasure-map' | 'minimal' | 'tropical'
   */
  setTheme(themeId) {
    this.config.theme = themeId;
    this.renderer.setTheme(themeId);

    // Apply theme colors/fonts to config
    var theme = this.registry.getTheme(themeId);
    if (theme && theme.colors) {
      for (var ck in theme.colors) {
        if (theme.colors.hasOwnProperty(ck)) {
          this.config.colors[ck] = theme.colors[ck];
        }
      }
    }
    if (theme && theme.fonts) {
      for (var fk in theme.fonts) {
        if (theme.fonts.hasOwnProperty(fk)) {
          this.config.fonts[fk] = theme.fonts[fk];
        }
      }
    }

    // Redraw everything
    this._drawStatic();
    if (this.cm) {
      this.cm.markDirty('depth');
      this.cm.markDirty('coast');
      this.cm.markDirty('atmosphere');
      this.cm.markDirty('weather');
      this.cm.markDirty('markers');
    }
  }

  /**
   * Handle container resize.
   */
  resize() {
    if (!this.cm) return;

    this.cm.resize();

    this.cm.markDirty('depth');
    this.cm.markDirty('currents');
    this.cm.markDirty('coast');
    this.cm.markDirty('weather');
    this.cm.markDirty('markers');
    this.cm.markDirty('vessels');
    this.cm.markDirty('atmosphere');

    this._drawStatic();
  }

  /**
   * Main per-frame draw function.
   * @private
   */
  _draw(t) {
    var cm = this.cm;
    if (!cm) return;

    // --- Static layers: only redraw when dirty ---

    var depthLayer = cm.getLayer('depth');
    if (depthLayer.dirty) {
      drawDepth(depthLayer.ctx, cm, this.config, t);
      depthLayer.dirty = false;
    }

    var coastLayer = cm.getLayer('coast');
    if (coastLayer.dirty) {
      drawCoast(coastLayer.ctx, cm, this.coastData, this.ports, this.routes, this.config, t, this.renderer);
      coastLayer.dirty = false;
    }

    var atmoLayer = cm.getLayer('atmosphere');
    if (atmoLayer.dirty) {
      drawAtmosphere(atmoLayer.ctx, cm, this.config);
      atmoLayer.dirty = false;
    }

    // Weather layer (static, refreshes on NOAA update)
    var weatherLayer = cm.getLayer('weather');
    if (weatherLayer && weatherLayer.dirty) {
      if (this.config.assets.showWeather && this.weatherData.length) {
        drawWeather(weatherLayer.ctx, cm, this.weatherData, this.weatherWarnings, this.renderer, this.config, t);
      } else {
        weatherLayer.ctx.clearRect(0, 0, cm.w, cm.h);
      }
      weatherLayer.dirty = false;
    }

    // Markers layer (static)
    var markersLayer = cm.getLayer('markers');
    if (markersLayer && markersLayer.dirty) {
      if (this.config.assets.showMarkers && this.markers.length) {
        drawMarkers(markersLayer.ctx, cm, this.markers, this.renderer, this.config, t);
      } else {
        markersLayer.ctx.clearRect(0, 0, cm.w, cm.h);
      }
      markersLayer.dirty = false;
    }

    // --- Animated layers: always redraw (60fps) ---

    var currLayer = cm.getLayer('currents');
    drawCurrents(currLayer.ctx, cm, this.particles, this.currentData, this.config, t);

    var vesselLayer = cm.getLayer('vessels');
    drawVessels(vesselLayer.ctx, cm, this.vessels, this.config, t, this.renderer);

    // --- Simulated vessel drift (when no AIS endpoint) ---

    if (!this.config.aisEndpoint && this.vessels) {
      for (var i = 0; i < this.vessels.length; i++) {
        var v = this.vessels[i];
        var phase = i * 1.7 + t * 0.3;
        v.lat += Math.sin(phase) * 0.00004;
        v.lon += Math.cos(phase * 0.7) * 0.00005;

        v.heading = (v.heading + Math.sin(t + i) * 0.15) % 360;
        if (v.heading < 0) v.heading += 360;
      }
    }
  }

  /**
   * Mark static layers dirty.
   * @private
   */
  _drawStatic() {
    if (!this.cm) return;
    this.cm.markDirty('depth');
    this.cm.markDirty('coast');
    this.cm.markDirty('atmosphere');
    this.cm.markDirty('weather');
    this.cm.markDirty('markers');
  }

  /**
   * Update fleet stats display.
   * @private
   */
  _updateStats() {
    if (!this.vessels || !this.container) return;

    var counts = {
      total: this.vessels.length,
      fishing: 0,
      transit: 0,
      port: 0,
      returning: 0,
    };

    for (var i = 0; i < this.vessels.length; i++) {
      var status = (this.vessels[i].status || '').toLowerCase();
      if (status === 'fishing') counts.fishing++;
      else if (status === 'in transit') counts.transit++;
      else if (status === 'in port') counts.port++;
      else if (status === 'returning') counts.returning++;
    }

    var statKeys = ['total', 'fishing', 'transit', 'port', 'returning'];
    for (var j = 0; j < statKeys.length; j++) {
      var el = this.container.querySelector('.fleet-stat-' + j);
      if (el) {
        el.textContent = counts[statKeys[j]];
      }
    }
  }
}
