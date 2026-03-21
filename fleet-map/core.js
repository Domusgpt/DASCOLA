/**
 * Fleet Map — Canvas Manager
 * Creates and manages the multi-canvas parallax stack.
 * Handles DPR-aware resizing and the render loop.
 *
 * Layer stack (bottom to top):
 *   1. depth       — Bathymetry, fathom lines, grid (static)
 *   2. currents    — Particle ocean currents (60fps)
 *   3. coast       — Coastline, land, ports, routes, labels (static + port pulse)
 *   4. weather     — Weather overlay (static, refreshes on NOAA update)
 *   5. markers     — Channel markers & nav aids (static)
 *   6. vessels     — Vessel silhouettes, trails, halos (60fps)
 *   7. atmosphere  — Fog vignette (static)
 */

import { proj, invProj } from './projection.js';

var LAYER_IDS = {
  depth:      'fleetCanvasDepth',
  currents:   'fleetCanvasCurrents',
  coast:      'fleetCanvasCoast',
  weather:    'fleetCanvasWeather',
  markers:    'fleetCanvasMarkers',
  vessels:    'fleetCanvasVessels',
  atmosphere: 'fleetCanvasAtmo',
};

var LAYER_NAMES = ['depth', 'currents', 'coast', 'weather', 'markers', 'vessels', 'atmosphere'];

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

    // Find each canvas by ID and build layer objects
    // New layers (weather, markers) are optional — created dynamically if missing
    for (var i = 0; i < LAYER_NAMES.length; i++) {
      var name = LAYER_NAMES[i];
      var canvasId = LAYER_IDS[name];
      var canvas = container.querySelector('#' + canvasId);
      if (!canvas) {
        canvas = container.querySelector('[data-layer="' + name + '"]');
      }
      if (!canvas) {
        // New optional layers — create canvas dynamically
        if (name === 'weather' || name === 'markers') {
          canvas = document.createElement('canvas');
          canvas.id = canvasId;
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.pointerEvents = 'none';
          // Insert before vessels canvas if it exists, otherwise append
          var vesselsCanvas = container.querySelector('#' + LAYER_IDS.vessels);
          if (vesselsCanvas) {
            container.insertBefore(canvas, vesselsCanvas);
          } else {
            container.appendChild(canvas);
          }
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

  /**
   * Resize all canvases to match container dimensions, respecting DPR.
   */
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
      if (!layer) continue;
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

  /**
   * Project geographic coordinates to screen coordinates.
   */
  proj(lat, lon) {
    return proj(lat, lon, this.config.bounds, this.w, this.h);
  }

  /**
   * Inverse project screen coordinates to geographic.
   */
  invProj(x, y) {
    return invProj(x, y, this.config.bounds, this.w, this.h);
  }

  /**
   * Get a layer object by name.
   */
  getLayer(name) {
    return this.layers[name];
  }

  /**
   * Mark a layer as needing redraw.
   */
  markDirty(name) {
    if (this.layers[name]) {
      this.layers[name].dirty = true;
    }
  }

  /**
   * Start the render loop.
   */
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

  /**
   * Stop the render loop.
   */
  stopLoop() {
    this.running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Clean up all resources.
   */
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
