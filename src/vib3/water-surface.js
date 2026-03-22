/**
 * VIB3 — Water Surface Effects
 * ==============================
 * Adds dynamic water surface texture to the fleet map:
 *   - Animated wave patterns (overlapping sine waves)
 *   - Underwater caustic light patterns
 *   - Swell direction indicators
 *   - Surface light shimmer
 *   - Depth-responsive wave intensity
 *
 * Renders on its own canvas layer inserted between the depth
 * and currents layers for proper visual stacking.
 */

var TAU = Math.PI * 2;

export class WaterSurface {
  constructor(container, canvasManager, config, options) {
    this.container = container;
    this.cm = canvasManager;
    this.config = config;
    this.intensity = options.intensity || 0.6;
    this.detail = options.detail || 'high';

    this.canvas = null;
    this.ctx = null;
    this._waves = [];
    this._causticPoints = [];
  }

  init() {
    var mapEl = this.container.querySelector('.fleet-map') || this.container;

    // Create a new canvas for water surface effects
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'fleetCanvasWaterSurface';
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;';

    // Insert after depth canvas (z-index 1), before currents (z-index 2)
    var currentsCanvas = mapEl.querySelector('#fleetCanvasCurrents');
    if (currentsCanvas) {
      mapEl.insertBefore(this.canvas, currentsCanvas);
    } else {
      mapEl.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    this._resize();

    // Generate wave parameters
    this._initWaves();
    this._initCaustics();

    // Listen for resize
    var self = this;
    this._resizeHandler = function () { self._resize(); };
    window.addEventListener('resize', this._resizeHandler);
  }

  _resize() {
    if (!this.canvas || !this.cm) return;
    var w = this.cm.w;
    var h = this.cm.h;
    var dpr = this.cm.dpr;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _initWaves() {
    // Multiple overlapping wave systems
    var count = this.detail === 'high' ? 5 : 3;
    this._waves = [];
    for (var i = 0; i < count; i++) {
      this._waves.push({
        amplitude: 0.3 + Math.random() * 0.4,
        wavelength: 60 + Math.random() * 120,
        speed: 0.3 + Math.random() * 0.5,
        angle: Math.random() * TAU,
        phase: Math.random() * TAU,
      });
    }
  }

  _initCaustics() {
    var count = this.detail === 'high' ? 40 : 20;
    this._causticPoints = [];
    for (var i = 0; i < count; i++) {
      this._causticPoints.push({
        x: Math.random(),
        y: Math.random(),
        radius: 15 + Math.random() * 40,
        speed: 0.2 + Math.random() * 0.4,
        phase: Math.random() * TAU,
        brightness: 0.02 + Math.random() * 0.03,
      });
    }
  }

  /**
   * Main draw function — called each frame.
   */
  draw(t) {
    if (!this.ctx || !this.cm) return;

    var w = this.cm.w;
    var h = this.cm.h;
    var ctx = this.ctx;
    var intensity = this.intensity;

    ctx.clearRect(0, 0, w, h);

    // Layer 1: Caustic light patterns
    this._drawCaustics(ctx, w, h, t, intensity);

    // Layer 2: Wave line patterns
    this._drawWaveLines(ctx, w, h, t, intensity);

    // Layer 3: Surface shimmer highlights
    this._drawShimmer(ctx, w, h, t, intensity);

    // Layer 4: Swell pattern overlay
    this._drawSwellPattern(ctx, w, h, t, intensity);
  }

  /**
   * Underwater caustic light patterns — shifting bright spots
   * that simulate light refracting through wave surfaces.
   */
  _drawCaustics(ctx, w, h, t, intensity) {
    for (var i = 0; i < this._causticPoints.length; i++) {
      var cp = this._causticPoints[i];
      var x = cp.x * w + Math.sin(t * cp.speed + cp.phase) * 30;
      var y = cp.y * h + Math.cos(t * cp.speed * 0.7 + cp.phase) * 25;
      var r = cp.radius + Math.sin(t * cp.speed * 1.3 + cp.phase) * 8;

      var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      var alpha = cp.brightness * intensity;
      grad.addColorStop(0, 'rgba(139,175,196,' + alpha + ')');
      grad.addColorStop(0.6, 'rgba(139,175,196,' + (alpha * 0.3) + ')');
      grad.addColorStop(1, 'rgba(139,175,196,0)');

      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  /**
   * Subtle horizontal wave lines that drift across the surface.
   */
  _drawWaveLines(ctx, w, h, t, intensity) {
    ctx.globalAlpha = 0.015 * intensity;
    ctx.strokeStyle = 'rgba(201,168,76,1)';
    ctx.lineWidth = 0.5;

    var spacing = this.detail === 'high' ? 25 : 40;

    for (var y = 0; y < h; y += spacing) {
      ctx.beginPath();
      for (var x = 0; x < w; x += 4) {
        var yOffset = 0;
        for (var wi = 0; wi < this._waves.length; wi++) {
          var wave = this._waves[wi];
          var dx = Math.cos(wave.angle);
          var dy = Math.sin(wave.angle);
          var dist = x * dx + y * dy;
          yOffset += Math.sin(dist / wave.wavelength * TAU + t * wave.speed + wave.phase) * wave.amplitude * 3;
        }
        if (x === 0) {
          ctx.moveTo(x, y + yOffset);
        } else {
          ctx.lineTo(x, y + yOffset);
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Surface light shimmer — bright specular highlights that move
   * across the water like sun glints.
   */
  _drawShimmer(ctx, w, h, t, intensity) {
    var count = this.detail === 'high' ? 8 : 4;
    for (var i = 0; i < count; i++) {
      var phase = i * 1.7 + t * 0.4;
      var x = (0.2 + Math.sin(phase * 0.3 + i) * 0.3) * w;
      var y = (0.3 + Math.cos(phase * 0.2 + i * 0.7) * 0.25) * h;
      var r = 40 + Math.sin(phase) * 20;
      var alpha = (0.02 + Math.sin(phase * 1.5) * 0.01) * intensity;

      if (alpha > 0) {
        var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(240,235,224,' + alpha + ')');
        grad.addColorStop(1, 'rgba(240,235,224,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
    }
  }

  /**
   * Swell pattern — very subtle repeating arcs that show
   * the dominant swell direction.
   */
  _drawSwellPattern(ctx, w, h, t, intensity) {
    ctx.globalAlpha = 0.008 * intensity;
    ctx.strokeStyle = 'rgba(139,175,196,1)';
    ctx.lineWidth = 1;

    var swellAngle = t * 0.05; // slowly rotating swell direction
    var spacing = 80;

    for (var i = -5; i < Math.ceil(Math.max(w, h) / spacing) + 5; i++) {
      var offset = i * spacing + Math.sin(t * 0.3) * 10;
      ctx.beginPath();
      for (var s = 0; s <= 1; s += 0.02) {
        var sx = s * w * 1.5 - w * 0.25;
        var sy = offset + Math.sin(sx * 0.008 + t * 0.5) * 15;
        // Rotate by swell angle
        var rx = sx * Math.cos(swellAngle) - sy * Math.sin(swellAngle) + w * 0.5;
        var ry = sx * Math.sin(swellAngle) + sy * Math.cos(swellAngle);
        if (s === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  destroy() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.cm = null;
    this.container = null;
    this.config = null;
    this._waves = null;
    this._causticPoints = null;
  }
}
