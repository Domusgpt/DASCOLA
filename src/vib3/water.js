/**
 * vib3 — Water Surface Visualizer
 * =================================
 * Renders dynamic water surface effects driven by weather data:
 *   - Animated wave patterns (swell direction + height)
 *   - Surface caustic light refraction
 *   - Wind-driven ripple texture
 *   - Sea state color modulation
 *
 * Draws on a dedicated canvas layer between depth and currents.
 */

var TAU = Math.PI * 2;

export function initWaterState() {
  return {
    time: 0,
    waveAngle: Math.PI * 0.75,
    waveHeight: 1.0,
    windSpeed: 8,
    windAngle: Math.PI * 0.5,
    seaStateIdx: 2,
    causticNodes: _generateCausticNodes(40),
  };
}

function _generateCausticNodes(count) {
  var nodes = [];
  for (var i = 0; i < count; i++) {
    nodes.push({
      x: Math.random(),
      y: Math.random(),
      phase: Math.random() * TAU,
      speed: 0.3 + Math.random() * 0.7,
      radius: 0.02 + Math.random() * 0.04,
    });
  }
  return nodes;
}

export function updateWaterFromWeather(waterState, weatherData) {
  if (!weatherData || !weatherData.regional) return;
  var r = weatherData.regional;

  waterState.windSpeed = r.windSpeed || 8;
  waterState.waveHeight = r.waveHeight || 1.0;

  if (r.windDeg !== undefined) {
    waterState.windAngle = r.windDeg * Math.PI / 180;
  }

  var seaMap = { 'Calm': 0, 'Smooth': 1, 'Slight': 2, 'Moderate': 3, 'Rough': 4 };
  if (r.seaState && seaMap[r.seaState] !== undefined) {
    waterState.seaStateIdx = seaMap[r.seaState];
  }

  if (r.swellDirection) {
    var dirMap = { 'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5,
      'SE': 135, 'SSE': 157.5, 'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5 };
    if (dirMap[r.swellDirection] !== undefined) {
      waterState.waveAngle = dirMap[r.swellDirection] * Math.PI / 180;
    }
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {object} waterState
 * @param {object} config
 * @param {number} t
 */
export function drawWaterSurface(ctx, w, h, waterState, config, t) {
  ctx.clearRect(0, 0, w, h);
  waterState.time = t;

  _drawWavePattern(ctx, w, h, waterState, config, t);
  _drawCaustics(ctx, w, h, waterState, config, t);
  _drawRipples(ctx, w, h, waterState, config, t);
  _drawSeaStateOverlay(ctx, w, h, waterState, config);
}

function _drawWavePattern(ctx, w, h, waterState, config, t) {
  var waveH = waterState.waveHeight;
  var angle = waterState.waveAngle;
  var intensity = Math.min(waveH / 3.0, 1.0) * 0.06;
  var lineCount = 12 + Math.floor(waveH * 4);
  var spacing = h / lineCount;

  ctx.save();
  ctx.globalAlpha = intensity;
  ctx.strokeStyle = config.colors.blade || 'rgba(139,175,196,1)';
  ctx.lineWidth = 0.8;

  var dx = Math.cos(angle);
  var dy = Math.sin(angle);

  for (var i = 0; i < lineCount; i++) {
    var baseY = i * spacing;
    var phase = t * (0.8 + waveH * 0.3) + i * 0.6;

    ctx.beginPath();
    for (var x = 0; x <= w; x += 8) {
      var waveDist = x * dx + baseY * dy;
      var offset = Math.sin(waveDist * 0.02 + phase) * (4 + waveH * 3);
      offset += Math.sin(waveDist * 0.05 + phase * 1.3) * (2 + waveH);

      var py = baseY + offset;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function _drawCaustics(ctx, w, h, waterState, config, t) {
  var nodes = waterState.causticNodes;
  var intensity = 0.025 + (waterState.seaStateIdx < 2 ? 0.015 : 0);

  ctx.save();
  ctx.globalAlpha = intensity;
  ctx.globalCompositeOperation = 'screen';

  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var nx = n.x * w + Math.sin(t * n.speed + n.phase) * 20;
    var ny = n.y * h + Math.cos(t * n.speed * 0.7 + n.phase) * 15;
    var r = n.radius * Math.min(w, h) * (0.8 + Math.sin(t * n.speed * 1.5 + n.phase) * 0.3);

    var grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, r);
    grad.addColorStop(0, 'rgba(180,220,255,0.6)');
    grad.addColorStop(0.5, 'rgba(140,200,240,0.2)');
    grad.addColorStop(1, 'rgba(100,180,220,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

function _drawRipples(ctx, w, h, waterState, config, t) {
  var windIntensity = Math.min(waterState.windSpeed / 20, 1.0);
  if (windIntensity < 0.1) return;

  var rippleCount = Math.floor(windIntensity * 30);
  var angle = waterState.windAngle;

  ctx.save();
  ctx.globalAlpha = windIntensity * 0.04;
  ctx.strokeStyle = 'rgba(200,220,240,0.5)';
  ctx.lineWidth = 0.5;

  for (var i = 0; i < rippleCount; i++) {
    var seedX = (Math.sin(i * 7.3 + t * 0.1) + 1) * 0.5 * w;
    var seedY = (Math.cos(i * 4.7 + t * 0.08) + 1) * 0.5 * h;

    var len = 8 + windIntensity * 12;

    ctx.beginPath();
    ctx.moveTo(seedX, seedY);
    ctx.lineTo(seedX + Math.cos(angle) * len, seedY + Math.sin(angle) * len);
    ctx.stroke();
  }

  ctx.restore();
}

function _drawSeaStateOverlay(ctx, w, h, waterState, config) {
  var idx = waterState.seaStateIdx;
  if (idx <= 1) return;

  var overlays = [
    null, null,
    'rgba(13,34,64,0.02)',
    'rgba(20,40,70,0.04)',
    'rgba(30,45,75,0.07)',
  ];

  if (idx < overlays.length && overlays[idx]) {
    ctx.fillStyle = overlays[idx];
    ctx.fillRect(0, 0, w, h);
  }
}
