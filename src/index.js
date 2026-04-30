/**
 * Fleet Map — Main Entry Point (v2.0 with vib3 Integration)
 * ===========================================================
 * A reusable, configurable fleet tracking map with integrated
 * water visualization, weather overlay, expandable detail panels,
 * and real-time coordination backbone via the vib3 SDK adapter.
 *
 * Usage:
 *   import { FleetMap } from './fleet-map/index.js';
 *
 *   var map = new FleetMap('#fleetMap', {
 *     title: 'My Fleet',
 *     bounds: { latN: -15, latS: -35, lonW: -55, lonE: -25 },
 *     vessels: [...],
 *     ports: [...],
 *     routes: [...],
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
import { drawWaterSurface, initWaterState, updateWaterFromWeather } from './vib3/water.js';
import { Vib3Adapter, EVENT_TYPES } from './vib3/adapter.js';
import { buildRoster } from './roster.js';
import { setupInteraction } from './interaction.js';
import { AISClient } from './ais.js';
import { createVesselDetailPanel, showVesselDetail, hideVesselDetail } from './panels/vessel-detail.js';
import { createPortDetailPanel, showPortDetail, hidePortDetail } from './panels/port-detail.js';
import { createCoordinationPanel, updateCoordMessages, updateCoordAlerts, updateCoordWeather, updateCoordBadge } from './panels/coordination.js';
import { BRAZIL_COAST } from './data/brazil-coast.js';
import { SA_CURRENTS } from './data/currents-sa.js';

function cloneArray(arr) {
  if (!arr) return [];
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    var copy = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) copy[k] = obj[k];
    }
    out.push(copy);
  }
  return out;
}

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
  constructor(selector, userConfig) {
    this.config = mergeConfig(userConfig);

    if (typeof selector === 'string') {
      this.container = document.querySelector(selector);
    } else {
      this.container = selector;
    }
    if (!this.container) {
      throw new Error('FleetMap: container not found — ' + selector);
    }

    this.vessels = prepareVessels(cloneArray(this.config.vessels));
    this.ports = cloneArray(this.config.ports);
    this.routes = cloneArray(this.config.routes);

    if (this.config.coastData === 'brazil') {
      this.coastData = BRAZIL_COAST;
    } else if (Array.isArray(this.config.coastData)) {
      this.coastData = this.config.coastData;
    } else {
      this.coastData = [];
    }

    if (this.config.currentData === 'south-atlantic') {
      this.currentData = SA_CURRENTS;
    } else if (Array.isArray(this.config.currentData)) {
      this.currentData = this.config.currentData;
    } else {
      this.currentData = [];
    }

    // Canvas manager (7 layers: depth, water-fx, currents, coast, weather, vessels, atmosphere)
    this.cm = new CanvasManager(this.container, this.config);

    // Particle system for ocean currents
    this.particles = initParticles(this.config);

    // vib3 water surface state
    this.waterState = initWaterState();

    // vib3 adapter for live maritime data
    this.vib3 = new Vib3Adapter(this.config);
    this._weatherData = null;
    this._unreadCoordCount = 0;

    // Projection function for port hit-testing in interaction handler
    var self = this;
    this.config._projFn = function(lat, lon) { return self.cm.proj(lat, lon); };

    // Wire click handlers
    this.config.onVesselClick = function(vessel, screenPos) {
      self._handleVesselClick(vessel, screenPos);
    };
    this.config.onPortClick = function(port, screenPos) {
      self._handlePortClick(port, screenPos);
    };
    this.config.onMapClick = function() {
      self._dismissPanels();
    };

    // Build roster panel
    this.rosterEl = buildRoster(this.container, this.vessels, this.config);

    // Setup mouse/touch interaction
    this._interactionCleanup = setupInteraction(this.cm, this.vessels, this.config);

    // Create expandable panels
    this._vesselPanel = createVesselDetailPanel(this.container);
    this._portPanel = createPortDetailPanel(this.container);
    this._coordPanel = createCoordinationPanel(this.container);

    // Wire coordination send handler
    if (this._coordPanel) {
      this._coordPanel._onSend = function(msg) {
        self.vib3.sendCoordMessage(msg);
      };
    }

    // AIS live-tracking client
    this.aisClient = null;
    if (this.config.aisEndpoint) {
      this.aisClient = new AISClient(this.config.aisEndpoint, this.config.aisRefreshMs);
    }

    this.started = false;
    this._resizeBound = this.resize.bind(this);
  }

  start() {
    if (this.started) return;
    this.started = true;

    this._drawStatic();

    var self = this;
    this.cm.startLoop(function (t) {
      self._draw(t);
    });

    // AIS polling
    if (this.aisClient) {
      this.aisClient.start(function (updatedVessels) {
        self.updateVessels(updatedVessels);
      });
    }

    // vib3 event subscriptions
    this.vib3.on(EVENT_TYPES.WEATHER_UPDATE, function(data) {
      self._weatherData = data;
      updateWaterFromWeather(self.waterState, data);
      if (self._coordPanel) updateCoordWeather(self._coordPanel, data);
    });

    this.vib3.on(EVENT_TYPES.COORD_MESSAGE, function() {
      self._unreadCoordCount++;
      if (self._coordPanel) {
        updateCoordMessages(self._coordPanel, self.vib3.getCoordLog());
        updateCoordBadge(self._coordPanel, self._unreadCoordCount);
      }
    });

    this.vib3.on(EVENT_TYPES.ALERT, function() {
      if (self._coordPanel) {
        updateCoordAlerts(self._coordPanel, self.vib3.getAlerts());
      }
    });

    this.vib3.start(this.vessels, this.ports);

    window.addEventListener('resize', this._resizeBound);
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    this.cm.stopLoop();
    if (this.aisClient) this.aisClient.stop();
    this.vib3.stop();
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._resizeBound);

    if (this._interactionCleanup) {
      this._interactionCleanup();
      this._interactionCleanup = null;
    }
    if (this.cm) { this.cm.destroy(); this.cm = null; }
    if (this.aisClient) { this.aisClient.stop(); this.aisClient = null; }
    if (this.vib3) { this.vib3.destroy(); this.vib3 = null; }

    this.vessels = null;
    this.ports = null;
    this.routes = null;
    this.coastData = null;
    this.currentData = null;
    this.particles = null;
    this.waterState = null;
    this._weatherData = null;
    this.rosterEl = null;
    this._vesselPanel = null;
    this._portPanel = null;
    this._coordPanel = null;
    this.container = null;
    this.config = null;
  }

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

  resize() {
    if (!this.cm) return;
    this.cm.resize();
    this.cm.markDirty('depth');
    this.cm.markDirty('water-fx');
    this.cm.markDirty('currents');
    this.cm.markDirty('coast');
    this.cm.markDirty('weather');
    this.cm.markDirty('vessels');
    this.cm.markDirty('atmosphere');
    this._drawStatic();
  }

  _draw(t) {
    var cm = this.cm;
    if (!cm) return;

    var w = cm.w, h = cm.h;
    var projFn = function(lat, lon) { return cm.proj(lat, lon); };
    var bounds = this.config.bounds;

    // --- Static layers: only redraw when dirty ---

    var depthLayer = cm.getLayer('depth');
    if (depthLayer && depthLayer.dirty) {
      drawDepth(depthLayer.ctx, w, h, projFn, this.config, t);
      depthLayer.dirty = false;
    }

    var coastLayer = cm.getLayer('coast');
    if (coastLayer && coastLayer.dirty) {
      drawCoast(coastLayer.ctx, w, h, projFn, this.config, t, this.coastData, this.ports, this.routes);
      coastLayer.dirty = false;
    }

    var atmoLayer = cm.getLayer('atmosphere');
    if (atmoLayer && atmoLayer.dirty) {
      drawAtmosphere(atmoLayer.ctx, w, h, this.config);
      atmoLayer.dirty = false;
    }

    // --- Animated layers: always redraw (60fps) ---

    // vib3 water surface effects
    var waterFxLayer = cm.getLayer('water-fx');
    if (waterFxLayer) {
      drawWaterSurface(waterFxLayer.ctx, w, h, this.waterState, this.config, t);
    }

    // Ocean currents
    var currLayer = cm.getLayer('currents');
    if (currLayer) {
      drawCurrents(currLayer.ctx, w, h, projFn, this.config, t, this.particles, this.currentData, bounds);
    }

    // Weather overlay
    var weatherLayer = cm.getLayer('weather');
    if (weatherLayer) {
      drawWeather(weatherLayer.ctx, w, h, projFn, this.config, t, this._weatherData);
    }

    // Vessels
    var vesselLayer = cm.getLayer('vessels');
    if (vesselLayer) {
      drawVessels(vesselLayer.ctx, w, h, projFn, this.config, t, this.vessels);
    }

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

  _drawStatic() {
    if (!this.cm) return;
    this.cm.markDirty('depth');
    this.cm.markDirty('coast');
    this.cm.markDirty('atmosphere');
  }

  _handleVesselClick(vessel, screenPos) {
    hidePortDetail(this._portPanel);
    showVesselDetail(this._vesselPanel, vessel, this._weatherData, screenPos);
  }

  _handlePortClick(port, screenPos) {
    hideVesselDetail(this._vesselPanel);
    var portData = this.vib3.getPortData(port.name);
    showPortDetail(this._portPanel, port, portData, screenPos);
  }

  _dismissPanels() {
    hideVesselDetail(this._vesselPanel);
    hidePortDetail(this._portPanel);
  }

  _updateStats() {
    if (!this.vessels || !this.container) return;
    var counts = { total: this.vessels.length, fishing: 0, transit: 0, port: 0, returning: 0 };
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
      if (el) el.textContent = counts[statKeys[j]];
    }
  }
}
