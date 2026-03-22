/**
 * VIB3 SDK — Visual Intelligence Backbone v3
 * =============================================
 * A layered plugin architecture for building rich, interactive maritime
 * visualization systems. VIB3 sits on top of FleetMap's canvas engine
 * and provides:
 *
 *   - Event bus for cross-component communication
 *   - Panel manager for expandable detail overlays
 *   - Weather engine with simulated atmospheric data
 *   - Water surface effects (waves, caustics, swells)
 *   - Fleet coordination messaging layer
 *   - Plugin registry for future extensions
 *
 * Usage:
 *   import { VIB3 } from './vib3/index.js';
 *
 *   var vib3 = new VIB3(fleetMap, {
 *     weather: true,
 *     waterSurface: true,
 *     coordination: true,
 *     panels: true,
 *   });
 *
 *   vib3.start();
 */

import { EventBus } from './event-bus.js';
import { PanelManager } from './panel-manager.js';
import { WeatherEngine } from './weather-engine.js';
import { WaterSurface } from './water-surface.js';
import { Coordination } from './coordination.js';

var VIB3_DEFAULTS = {
  weather: true,
  waterSurface: true,
  coordination: true,
  panels: true,
  weatherRefreshMs: 30000,
  swellIntensity: 0.6,
  waveDetail: 'high',
};

export class VIB3 {
  constructor(fleetMap, options) {
    this.fleetMap = fleetMap;
    this.options = {};
    var key;
    for (key in VIB3_DEFAULTS) {
      if (VIB3_DEFAULTS.hasOwnProperty(key)) {
        this.options[key] = VIB3_DEFAULTS[key];
      }
    }
    if (options) {
      for (key in options) {
        if (options.hasOwnProperty(key)) {
          this.options[key] = options[key];
        }
      }
    }

    // Core event bus — everything communicates through this
    this.events = new EventBus();

    // Plugin registry
    this.plugins = {};

    // Sub-systems (initialized on start)
    this.panels = null;
    this.weather = null;
    this.waterSurface = null;
    this.coordination = null;

    this._started = false;
  }

  /**
   * Initialize and start all VIB3 subsystems.
   */
  start() {
    if (this._started) return;
    this._started = true;

    var fm = this.fleetMap;
    var container = fm.container;
    var config = fm.config;

    // --- Panel Manager ---
    if (this.options.panels) {
      this.panels = new PanelManager(container, this.events, config);
      this.panels.init();
    }

    // --- Weather Engine ---
    if (this.options.weather) {
      this.weather = new WeatherEngine(this.events, config, {
        refreshMs: this.options.weatherRefreshMs,
        bounds: config.bounds,
      });
      this.weather.start();
    }

    // --- Water Surface ---
    if (this.options.waterSurface) {
      this.waterSurface = new WaterSurface(container, fm.cm, config, {
        intensity: this.options.swellIntensity,
        detail: this.options.waveDetail,
      });
      this.waterSurface.init();
    }

    // --- Coordination ---
    if (this.options.coordination) {
      this.coordination = new Coordination(this.events, config, fm.vessels);
      this.coordination.init();
    }

    // Wire up FleetMap interaction events to VIB3
    this._wireInteractions();

    // Notify all listeners that VIB3 is live
    this.events.emit('vib3:ready', { timestamp: Date.now() });
  }

  /**
   * Hook into FleetMap's existing interaction system to power VIB3 panels.
   */
  _wireInteractions() {
    var self = this;
    var fm = this.fleetMap;
    var container = fm.container;
    var config = fm.config;

    // Override vessel click to open expandable panel
    var originalClick = config.onVesselClick;
    config.onVesselClick = function (vessel) {
      self.events.emit('vessel:click', vessel);
      if (self.panels) {
        self.panels.openVesselPanel(vessel, self.weather ? self.weather.getConditionsAt(vessel.lat, vessel.lon) : null);
      }
      if (typeof originalClick === 'function') {
        originalClick(vessel);
      }
    };

    // Listen for port clicks (we add port hit detection)
    this._setupPortInteraction(container, fm);

    // Listen for map background clicks to close panels
    this.events.on('map:click:empty', function () {
      if (self.panels) self.panels.closeAll();
    });
  }

  /**
   * Add hit detection for ports so they can be clicked to expand.
   */
  _setupPortInteraction(container, fm) {
    var self = this;
    var mapEl = container.querySelector('.fleet-map') || container;

    mapEl.addEventListener('click', function (e) {
      var rect = mapEl.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;

      // Check port hit
      var ports = fm.ports || [];
      var HIT_R = 20;
      for (var i = 0; i < ports.length; i++) {
        var port = ports[i];
        var sp = fm.cm.proj(port.lat, port.lon);
        var dx = mx - sp.x;
        var dy = my - sp.y;
        if (Math.sqrt(dx * dx + dy * dy) < HIT_R) {
          self.events.emit('port:click', port);
          if (self.panels) {
            self.panels.openPortPanel(port, self.weather ? self.weather.getConditionsAt(port.lat, port.lon) : null);
          }
          return;
        }
      }

      // Check if we hit a vessel (handled by FleetMap's own click)
      var vessels = fm.vessels || [];
      for (var j = 0; j < vessels.length; j++) {
        var v = vessels[j];
        var vdx = mx - (v._sx || 0);
        var vdy = my - (v._sy || 0);
        if (Math.sqrt(vdx * vdx + vdy * vdy) < 18) {
          return; // vessel click handled by FleetMap
        }
      }

      // Empty map click
      self.events.emit('map:click:empty', { x: mx, y: my });
    });
  }

  /**
   * Called each frame by FleetMap's render loop.
   */
  tick(t) {
    if (this.waterSurface) {
      this.waterSurface.draw(t);
    }
    if (this.weather) {
      this.weather.tick(t);
    }
    if (this.coordination) {
      this.coordination.tick(t);
    }
  }

  /**
   * Register a plugin.
   */
  registerPlugin(name, plugin) {
    this.plugins[name] = plugin;
    if (typeof plugin.init === 'function') {
      plugin.init(this);
    }
    this.events.emit('plugin:registered', { name: name });
  }

  /**
   * Get current weather state.
   */
  getWeather() {
    return this.weather ? this.weather.getState() : null;
  }

  /**
   * Get coordination state.
   */
  getCoordination() {
    return this.coordination ? this.coordination.getState() : null;
  }

  /**
   * Full teardown.
   */
  destroy() {
    if (this.panels) { this.panels.destroy(); this.panels = null; }
    if (this.weather) { this.weather.destroy(); this.weather = null; }
    if (this.waterSurface) { this.waterSurface.destroy(); this.waterSurface = null; }
    if (this.coordination) { this.coordination.destroy(); this.coordination = null; }
    this.events.clear();
    this.events = null;
    this.fleetMap = null;
    this.plugins = null;
    this._started = false;
  }
}
