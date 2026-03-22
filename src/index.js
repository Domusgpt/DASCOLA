/**
 * Fleet Map — Main Entry Point
 * =============================
 * A reusable, configurable fleet tracking map for the fishing industry.
 *
 * Usage:
 *   import { FleetMap } from './fleet-map/index.js';
 *
 *   var map = new FleetMap('#fleetMap', {
 *     title: 'My Fleet',
 *     bounds: { latN: -15, latS: -35, lonW: -55, lonE: -25 },
 *     vessels: [ { name: 'Boat 1', lat: -24, lon: -44, heading: 135, speed: 7, type: 'Longliner', status: 'Fishing', catch: 'Swordfish' } ],
 *     ports: [ { name: 'Santos', lat: -23.96, lon: -46.33, size: 'major' } ],
 *     routes: [ { name: 'US East Coast', points: [[-23.96,-46.33],[-22,-42],[5,-40],[40.7,-74]] } ],
 *   });
 *
 *   map.start();  // Begin rendering
 *   map.stop();   // Pause
 *   map.destroy(); // Clean up
 *   map.updateVessels([...]); // Update vessel data (e.g., from dashboard)
 *
 * Configuration:
 *   See config.js for all available options including colors, fonts,
 *   AIS endpoint, particle count, and more.
 *
 * Vessel Data Format:
 *   Each vessel object: {
 *     name: string,         — Display name
 *     mmsi: string|null,    — AIS MMSI number (for live tracking)
 *     lat: number,          — Latitude (decimal degrees, negative = south)
 *     lon: number,          — Longitude (decimal degrees, negative = west)
 *     heading: number,      — Heading in degrees (0 = north, 90 = east)
 *     speed: number,        — Speed in knots
 *     type: string,         — Vessel type ('Longliner', 'Trawler', etc.)
 *     status: string,       — 'Fishing' | 'In Transit' | 'In Port' | 'Returning'
 *     catch: string,        — Current catch description
 *   }
 *
 * Adding/Removing Vessels:
 *   Simply call map.updateVessels(newArray) with the updated list.
 *   The roster panel, stats, and map all update automatically.
 *   For a future dashboard UI, this method is the integration point.
 */

import { mergeConfig } from './config.js';
import { CanvasManager } from './core.js';
import { drawDepth } from './layers/depth.js';
import { drawCurrents, initParticles } from './layers/currents.js';
import { drawCoast } from './layers/coast.js';
import { drawVessels } from './layers/vessels.js';
import { drawAtmosphere } from './layers/atmosphere.js';
import { drawWeather, initRainParticles } from './layers/weather.js';
import { buildRoster } from './roster.js';
import { setupInteraction } from './interaction.js';
import { AISClient } from './ais.js';
import { VIB3 } from './vib3/index.js';
import { BRAZIL_COAST } from './data/brazil-coast.js';
import { SA_CURRENTS } from './data/currents-sa.js';
import { LBI_COAST } from './data/lbi-coast.js';
import { NJ_CURRENTS } from './data/currents-nj.js';

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

    // Resolve coast data
    if (this.config.coastData === 'brazil') {
      this.coastData = BRAZIL_COAST;
    } else if (this.config.coastData === 'lbi') {
      this.coastData = LBI_COAST;
    } else if (Array.isArray(this.config.coastData)) {
      this.coastData = this.config.coastData;
    } else {
      this.coastData = [];
    }

    // Resolve current flow data
    if (this.config.currentData === 'south-atlantic') {
      this.currentData = SA_CURRENTS;
    } else if (this.config.currentData === 'nj-atlantic') {
      this.currentData = NJ_CURRENTS;
    } else if (Array.isArray(this.config.currentData)) {
      this.currentData = this.config.currentData;
    } else {
      this.currentData = [];
    }

    // Create canvas manager
    this.cm = new CanvasManager(this.container, this.config);

    // Init current particles
    this.particles = initParticles(this.config);

    // Init rain particles for weather layer
    this.rainParticles = initRainParticles();

    // Build roster panel
    this.rosterEl = buildRoster(this.container, this.vessels, this.config);

    // Setup mouse/touch interaction
    this._interactionCleanup = setupInteraction(this.container, this.vessels, this.config);

    // AIS live-tracking client
    this.aisClient = null;
    if (this.config.aisEndpoint) {
      this.aisClient = new AISClient(this.config, this.vessels, null);
    }

    // Weather canvas (added dynamically above atmosphere)
    this._weatherCanvas = null;
    this._weatherCtx = null;
    this._initWeatherCanvas();

    // VIB3 SDK integration
    this.vib3 = null;
    if (this.config.vib3 !== false) {
      this.vib3 = new VIB3(this, this.config.vib3Options || {});
    }

    // State
    this.started = false;
    this._resizeBound = this.resize.bind(this);
  }

  /**
   * Create the weather overlay canvas.
   * @private
   */
  _initWeatherCanvas() {
    var mapEl = this.container.querySelector('.fleet-map') || this.container;
    this._weatherCanvas = document.createElement('canvas');
    this._weatherCanvas.id = 'fleetCanvasWeather';
    this._weatherCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none;';

    var atmoCanvas = mapEl.querySelector('#fleetCanvasAtmo');
    if (atmoCanvas) {
      mapEl.insertBefore(this._weatherCanvas, atmoCanvas);
    } else {
      mapEl.appendChild(this._weatherCanvas);
    }

    this._weatherCtx = this._weatherCanvas.getContext('2d');
    this._resizeWeatherCanvas();
  }

  _resizeWeatherCanvas() {
    if (!this._weatherCanvas || !this.cm) return;
    var w = this.cm.w;
    var h = this.cm.h;
    var dpr = this.cm.dpr;
    this._weatherCanvas.width = w * dpr;
    this._weatherCanvas.height = h * dpr;
    this._weatherCanvas.style.width = w + 'px';
    this._weatherCanvas.style.height = h + 'px';
    this._weatherCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Begin rendering and (optionally) AIS polling.
   */
  start() {
    if (this.started) return;
    this.started = true;

    // Draw static layers once — they'll render on the next frame
    this._drawStatic();

    // Start the animation loop
    var self = this;
    this.cm.startLoop(function (t) {
      self._draw(t);
    });

    // Start AIS polling if configured
    if (this.aisClient) {
      this.aisClient.start();
    }

    // Listen for window resize
    window.addEventListener('resize', this._resizeBound);

    // Start VIB3 SDK
    if (this.vib3) {
      this.vib3.start();
    }
  }

  /**
   * Pause rendering and AIS polling.
   */
  stop() {
    if (!this.started) return;
    this.started = false;

    this.cm.stopLoop();

    if (this.aisClient) {
      this.aisClient.stop();
    }
  }

  /**
   * Clean up all resources. Call this when removing the map from the page.
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

    if (this.vib3) {
      this.vib3.destroy();
      this.vib3 = null;
    }

    if (this._weatherCanvas && this._weatherCanvas.parentNode) {
      this._weatherCanvas.parentNode.removeChild(this._weatherCanvas);
    }
    this._weatherCanvas = null;
    this._weatherCtx = null;

    this.vessels = null;
    this.ports = null;
    this.routes = null;
    this.coastData = null;
    this.currentData = null;
    this.particles = null;
    this.rainParticles = null;
    this.rosterEl = null;
    this.container = null;
    this.config = null;
  }

  /**
   * Replace the vessel list. Rebuilds the roster and updates stats.
   * This is the main integration point for dashboard UIs.
   *
   * @param {Array} arr — new array of vessel objects
   */
  updateVessels(arr) {
    this.vessels = prepareVessels(cloneArray(arr));

    // Rebuild the roster panel
    if (this.container && this.config) {
      this.rosterEl = buildRoster(this.container, this.vessels, this.config);
    }

    // Update stats display
    this._updateStats();

    // Fire callback
    if (this.config && typeof this.config.onAISUpdate === 'function') {
      this.config.onAISUpdate(this.vessels);
    }
  }

  /**
   * Handle container resize.
   */
  resize() {
    if (!this.cm) return;

    this.cm.resize();

    // All layers need redraw after resize
    this.cm.markDirty('depth');
    this.cm.markDirty('currents');
    this.cm.markDirty('coast');
    this.cm.markDirty('vessels');
    this.cm.markDirty('atmosphere');

    // Resize weather canvas
    this._resizeWeatherCanvas();

    // Redraw static layers
    this._drawStatic();
  }

  /**
   * Main per-frame draw function. Called by the canvas manager loop.
   * @param {number} t — elapsed time counter
   * @private
   */
  _draw(t) {
    var cm = this.cm;
    if (!cm) return;

    // --- Static layers: only redraw when dirty ---

    var depthLayer = cm.getLayer('depth');
    if (depthLayer.dirty) {
      drawDepth(depthLayer.ctx, cm, this.config);
      depthLayer.dirty = false;
    }

    var coastLayer = cm.getLayer('coast');
    if (coastLayer.dirty) {
      drawCoast(coastLayer.ctx, cm, this.coastData, this.ports, this.routes, this.config, t);
      coastLayer.dirty = false;
    }

    var atmoLayer = cm.getLayer('atmosphere');
    if (atmoLayer.dirty) {
      drawAtmosphere(atmoLayer.ctx, cm, this.config);
      atmoLayer.dirty = false;
    }

    // --- Animated layers: always redraw (60fps) ---

    var currLayer = cm.getLayer('currents');
    drawCurrents(currLayer.ctx, cm, this.particles, this.currentData, this.config, t);

    var vesselLayer = cm.getLayer('vessels');
    drawVessels(vesselLayer.ctx, cm, this.vessels, this.config, t);

    // --- Weather overlay ---
    if (this._weatherCtx && this.vib3 && this.vib3.weather) {
      drawWeather(this._weatherCtx, cm.w, cm.h, this.config, this.vib3.weather.getState(), t, this.rainParticles);
    }

    // --- VIB3 per-frame tick ---
    if (this.vib3) {
      this.vib3.tick(t);
    }

    // --- Simulated vessel drift (when no AIS endpoint) ---

    if (!this.config.aisEndpoint && this.vessels) {
      for (var i = 0; i < this.vessels.length; i++) {
        var v = this.vessels[i];
        // Small sin/cos wobble to simulate GPS drift
        var phase = i * 1.7 + t * 0.3;
        v.lat += Math.sin(phase) * 0.00004;
        v.lon += Math.cos(phase * 0.7) * 0.00005;

        // Slowly rotate heading
        v.heading = (v.heading + Math.sin(t + i) * 0.15) % 360;
        if (v.heading < 0) v.heading += 360;
      }
    }
  }

  /**
   * Mark static layers dirty so they redraw on the next frame.
   * @private
   */
  _drawStatic() {
    if (!this.cm) return;
    this.cm.markDirty('depth');
    this.cm.markDirty('coast');
    this.cm.markDirty('atmosphere');
  }

  /**
   * Update the fleet stats display elements if they exist in the DOM.
   * Looks for elements with class `fleet-stat-n` where n is 0-based.
   * @private
   */
  _updateStats() {
    if (!this.vessels || !this.container) return;

    // Count vessels by status
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

    // Update stat elements if they exist
    var statKeys = ['total', 'fishing', 'transit', 'port', 'returning'];
    for (var j = 0; j < statKeys.length; j++) {
      var el = this.container.querySelector('.fleet-stat-' + j);
      if (el) {
        el.textContent = counts[statKeys[j]];
      }
    }
  }
}
