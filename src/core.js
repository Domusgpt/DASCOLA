/**
 * Fleet Map — Canvas Manager
 * Creates and manages the 7-canvas parallax stack.
 * Handles DPR-aware resizing and the render loop.
 *
 * Layer stack (bottom to top):
 *   1. depth      — Bathymetry, fathom lines, grid (static)
 *   2. water-fx   — vib3 water surface effects (60fps)
 *   3. currents   — Particle ocean currents (60fps)
 *   4. coast      — Coastline, land, ports, routes, labels (static + port pulse)
 *   5. weather    — Wind, rain, visibility overlay (60fps)
 *   6. vessels    — Vessel triangles, trails, halos (60fps)
 *   7. atmosphere — Fog vignette (static)
 */

import { proj, invProj } from './projection.js';

var LAYER_IDS = {
  depth:      'fleetCanvasDepth',
  'water-fx': 'fleetCanvasWaterFx',
  currents:   'fleetCanvasCurrents',
  coast:      'fleetCanvasCoast',
  weather:    'fleetCanvasWeather',
  vessels:    'fleetCanvasVessels',
  atmosphere: 'fleetCanvasAtmo',
};

var LAYER_NAMES = ['depth', 'water-fx', 'currents', 'coast', 'weather', 'vessels', 'atmosphere'];

export class CanvasManager {
  /**
   * @param {HTMLElement} container — the .fleet-map DOM element
   * @param {object} config — merged FleetMap config
   */
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.layers = {};
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.t = 0;
    this.running = false;
    this._drawFn = null;
    this._rafId = null;

    for (var i = 0; i < LAYER_NAMES.length; i++) {
      var name = LAYER_NAMES[i];
      var canvasId = LAYER_IDS[name];
      var canvas = container.querySelector('#' + canvasId);
      if (!canvas) {
        canvas = container.querySelector('[data-layer="' + name + '"]');
      }
      if (!canvas) {
        // Optional layers: create canvas dynamically if not in DOM
        if (name === 'water-fx' || name === 'weather') {
          canvas = document.createElement('canvas');
          canvas.id = canvasId;
          canvas.setAttribute('data-layer', name);
          container.appendChild(canvas);
        } else {
          throw new Error('FleetMap: missing canvas #' + canvasId);
        }
      }
      this.layers[name] = {
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        dirty: true,
      };
    }

    this.resize();
  }

  resize() {
    var rect = this.container.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = rect.width;
    var h = rect.height;

    this.w = w;
    this.h = h;
    this.dpr = dpr;

    for (var i = 0; i < LAYER_NAMES.length; i++) {
      var layer = this.layers[LAYER_NAMES[i]];
      if (!layer || !layer.canvas) continue;
      var canvas = layer.canvas;
      var ctx = layer.ctx;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      layer.dirty = true;
    }
  }

  proj(lat, lon) {
    return proj(lat, lon, this.config.bounds, this.w, this.h);
  }

  invProj(x, y) {
    return invProj(x, y, this.config.bounds, this.w, this.h);
  }

  getLayer(name) {
    return this.layers[name];
  }

  markDirty(name) {
    if (this.layers[name]) {
      this.layers[name].dirty = true;
    }
  }

  startLoop(drawFn) {
    this._drawFn = drawFn;
    this.running = true;

    var self = this;
    function tick() {
      if (!self.running) return;
      self.t += 0.008;
      self._drawFn(self.t);
      self._rafId = requestAnimationFrame(tick);
    }
    self._rafId = requestAnimationFrame(tick);
  }

  stopLoop() {
    this.running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  destroy() {
    this.stopLoop();
    this._drawFn = null;
    this.container = null;
    this.config = null;
    for (var i = 0; i < LAYER_NAMES.length; i++) {
      var layer = this.layers[LAYER_NAMES[i]];
      if (layer) {
        layer.ctx = null;
        layer.canvas = null;
      }
    }
    this.layers = null;
  }
}
