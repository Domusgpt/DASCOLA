/**
 * Viking Village Fleet Map — Main Entry Point
 * ==============================================
 * Interactive fleet tracking map for Viking Village,
 * Barnegat Light, Long Beach Island, New Jersey.
 *
 * Usage:
 *   import { FleetMap } from './viking-village-map/index.js';
 *
 *   var map = new FleetMap('#fleetMap', {
 *     title: 'Viking Village',
 *     vessels: [...],
 *     ports: [...],
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
import { buildRoster } from './roster.js';
import { setupInteraction } from './interaction.js';
import { AISClient } from './ais.js';
import { LBI_COAST } from './data/lbi-coast.js';
import { NJ_CURRENTS } from './data/currents-nj.js';

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

    // Resolve coast data — LBI is the built-in default
    if (this.config.coastData === 'lbi') {
      this.coastData = LBI_COAST;
    } else if (Array.isArray(this.config.coastData)) {
      this.coastData = this.config.coastData;
    } else {
      this.coastData = LBI_COAST; // fallback to LBI
    }

    // Resolve current flow data
    if (this.config.currentData === 'nj-atlantic') {
      this.currentData = NJ_CURRENTS;
    } else if (Array.isArray(this.config.currentData)) {
      this.currentData = this.config.currentData;
    } else {
      this.currentData = NJ_CURRENTS; // fallback
    }

    this.cm = new CanvasManager(this.container, this.config);
    this.particles = initParticles(this.config);
    this.rosterEl = buildRoster(this.container, this.vessels, this.config);
    this._interactionCleanup = setupInteraction(this.container, this.vessels, this.config);

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
      var self2 = this;
      this.aisClient.start(function (updatedVessels) {
        self2.updateVessels(updatedVessels);
      });
    }

    window.addEventListener('resize', this._resizeBound);
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    this.cm.stopLoop();
    if (this.aisClient) {
      this.aisClient.stop();
    }
  }

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
    this.vessels = null;
    this.ports = null;
    this.routes = null;
    this.coastData = null;
    this.currentData = null;
    this.particles = null;
    this.rosterEl = null;
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
    this.cm.markDirty('currents');
    this.cm.markDirty('coast');
    this.cm.markDirty('vessels');
    this.cm.markDirty('atmosphere');
    this._drawStatic();
  }

  _draw(t) {
    var cm = this.cm;
    if (!cm) return;

    // Static layers: only redraw when dirty
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

    // Animated layers: always redraw
    var currLayer = cm.getLayer('currents');
    drawCurrents(currLayer.ctx, cm, this.particles, this.currentData, this.config, t);

    var vesselLayer = cm.getLayer('vessels');
    drawVessels(vesselLayer.ctx, cm, this.vessels, this.config, t);

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
      if (status === 'fishing' || status === 'scalloping') counts.fishing++;
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
