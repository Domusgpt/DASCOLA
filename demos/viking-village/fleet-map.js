/**
 * Viking Village Fleet Map — Main Entry Point (v2.0)
 * ====================================================
 * Interactive fleet tracking map for Viking Village,
 * Barnegat Light, Long Beach Island, New Jersey.
 * Now with vib3 water effects, weather overlay, expandable
 * vessel/port panels, and fleet coordination.
 */

import { mergeConfig } from './config.js';
import { CanvasManager } from '../../src/core.js';
import { drawDepth } from './layers/depth.js';
import { drawCurrents, initParticles } from './layers/currents.js';
import { drawCoast } from './layers/coast.js';
import { drawVessels } from './layers/vessels.js';
import { drawAtmosphere } from './layers/atmosphere.js';
import { drawWeather } from '../../src/layers/weather.js';
import { drawWaterSurface, initWaterState, updateWaterFromWeather } from '../../src/vib3/water.js';
import { Vib3Adapter, EVENT_TYPES } from '../../src/vib3/adapter.js';
import { buildRoster } from '../../src/roster.js';
import { setupInteraction } from '../../src/interaction.js';
import { AISClient } from '../../src/ais.js';
import { createVesselDetailPanel, showVesselDetail, hideVesselDetail } from '../../src/panels/vessel-detail.js';
import { createPortDetailPanel, showPortDetail, hidePortDetail } from '../../src/panels/port-detail.js';
import { createCoordinationPanel, updateCoordMessages, updateCoordAlerts, updateCoordWeather, updateCoordBadge } from '../../src/panels/coordination.js';
import { LBI_COAST } from '../../src/data/lbi-coast.js';
import { NJ_CURRENTS } from '../../src/data/currents-nj.js';

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

    if (this.config.coastData === 'lbi') {
      this.coastData = LBI_COAST;
    } else if (Array.isArray(this.config.coastData)) {
      this.coastData = this.config.coastData;
    } else {
      this.coastData = LBI_COAST;
    }

    if (this.config.currentData === 'nj-atlantic') {
      this.currentData = NJ_CURRENTS;
    } else if (Array.isArray(this.config.currentData)) {
      this.currentData = this.config.currentData;
    } else {
      this.currentData = NJ_CURRENTS;
    }

    this.cm = new CanvasManager(this.container, this.config);
    this.particles = initParticles(this.config);
    this.waterState = initWaterState();

    this.vib3 = new Vib3Adapter(this.config);
    this._weatherData = null;
    this._unreadCoordCount = 0;

    var self = this;
    this.config._projFn = function(lat, lon) { return self.cm.proj(lat, lon); };

    this.config.onVesselClick = function(vessel, screenPos) {
      self._handleVesselClick(vessel, screenPos);
    };
    this.config.onPortClick = function(port, screenPos) {
      self._handlePortClick(port, screenPos);
    };
    this.config.onMapClick = function() {
      self._dismissPanels();
    };

    this.rosterEl = buildRoster(this.container, this.vessels, this.config);
    this._interactionCleanup = setupInteraction(this.container, this.vessels, this.config);

    this._vesselPanel = createVesselDetailPanel(this.container);
    this._portPanel = createPortDetailPanel(this.container);
    this._coordPanel = createCoordinationPanel(this.container);

    if (this._coordPanel) {
      this._coordPanel._onSend = function(msg) {
        self.vib3.sendCoordMessage(msg);
      };
    }

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

    if (this.aisClient) {
      this.aisClient.start(function (updatedVessels) {
        self.updateVessels(updatedVessels);
      });
    }

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
    if (this._interactionCleanup) { this._interactionCleanup(); this._interactionCleanup = null; }
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

    // Static layers — VV local layer files use (ctx, cm, ...) convention
    var depthLayer = cm.getLayer('depth');
    if (depthLayer && depthLayer.dirty) {
      drawDepth(depthLayer.ctx, cm, this.config);
      depthLayer.dirty = false;
    }

    var coastLayer = cm.getLayer('coast');
    if (coastLayer && coastLayer.dirty) {
      drawCoast(coastLayer.ctx, cm, this.coastData, this.ports, this.routes, this.config, t);
      coastLayer.dirty = false;
    }

    var atmoLayer = cm.getLayer('atmosphere');
    if (atmoLayer && atmoLayer.dirty) {
      drawAtmosphere(atmoLayer.ctx, cm, this.config);
      atmoLayer.dirty = false;
    }

    // Animated layers
    var waterFxLayer = cm.getLayer('water-fx');
    if (waterFxLayer) {
      drawWaterSurface(waterFxLayer.ctx, w, h, this.waterState, this.config, t);
    }

    var currLayer = cm.getLayer('currents');
    if (currLayer) {
      drawCurrents(currLayer.ctx, cm, this.particles, this.currentData, this.config, t);
    }

    var weatherLayer = cm.getLayer('weather');
    if (weatherLayer) {
      drawWeather(weatherLayer.ctx, w, h, projFn, this.config, t, this._weatherData);
    }

    var vesselLayer = cm.getLayer('vessels');
    if (vesselLayer) {
      drawVessels(vesselLayer.ctx, cm, this.vessels, this.config, t);
    }

    // Simulated vessel drift
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
      if (status === 'fishing' || status === 'scalloping') counts.fishing++;
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
