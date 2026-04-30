/**
 * vib3 — Water Surface Visualizer
 * =================================
 * Dynamic ocean surface effects driven by weather data.
 * Draws on a dedicated canvas layer between depth and currents.
 */

var TAU = Math.PI * 2;

export function initWaterState() {
  return {
    time: 0,
    waveAngle: Math.PI * 0.75,
    waveHeight: 1.5,
    windSpeed: 10,
    windAngle: Math.PI * 0.5,
    seaStateIdx: 2,
    causticNodes: _genCaustics(80),
    rippleSeeds: _genRippleSeeds(60),
  };
}

function _genCaustics(n) {
  var nodes = [];
  for (var i = 0; i < n; i++) {
    nodes.push({
      x: Math.random(), y: Math.random(),
      phase: Math.random() * TAU,
      speed: 0.2 + Math.random() * 0.6,
      size: 0.03 + Math.random() * 0.06,
    });
  }
  return nodes;
}

function _genRippleSeeds(n) {
  var seeds = [];
  for (var i = 0; i < n; i++) {
    seeds.push({ x: Math.random(), y: Math.random(), phase: Math.random() * TAU });
  }
  return seeds;
}

export function updateWaterFromWeather(waterState, weatherData) {
  if (!weatherData || !weatherData.regional) return;
  var r = weatherData.regional;
  waterState.windSpeed = r.windSpeed || 10;
  waterState.waveHeight = r.waveHeight || 1.5;
  if (r.windDeg !== undefined) waterState.windAngle = r.windDeg * Math.PI / 180;
  var seaMap = { 'Calm': 0, 'Smooth': 1, 'Slight': 2, 'Moderate': 3, 'Rough': 4 };
  if (r.seaState && seaMap[r.seaState] !== undefined) waterState.seaStateIdx = seaMap[r.seaState];
  if (r.swellDirection) {
    var dirMap = { 'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5,
      'SE': 135, 'SSE': 157.5, 'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5 };
    if (dirMap[r.swellDirection] !== undefined) waterState.waveAngle = dirMap[r.swellDirection] * Math.PI / 180;
  }
}

export function drawWaterSurface(ctx, w, h, waterState, config, t) {
  ctx.clearRect(0, 0, w, h);
  waterState.time = t;
  _drawSwellLines(ctx, w, h, waterState, config, t);
  _drawCausticLight(ctx, w, h, waterState, t);
  _drawWindRipples(ctx, w, h, waterState, t);
  _drawDepthGlow(ctx, w, h, waterState);
}

function _drawSwellLines(ctx, w, h, ws, config, t) {
  var wH = ws.waveHeight;
  var angle = ws.waveAngle;
  var alpha = Math.min(wH / 2.0, 1.0) * 0.22;
  var count = 20 + Math.floor(wH * 8);
  var gap = h / count;
  var dx = Math.cos(angle), dy = Math.sin(angle);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1;

  for (var i = 0; i < count; i++) {
    var baseY = i * gap;
    var phase = t * (0.6 + wH * 0.4) + i * 0.5;
    var brightness = 0.3 + Math.sin(i * 0.4 + t * 0.2) * 0.15;

    ctx.strokeStyle = 'rgba(100,160,200,' + brightness + ')';
    ctx.beginPath();
    for (var x = 0; x <= w; x += 6) {
      var dist = x * dx + baseY * dy;
      var y = baseY
        + Math.sin(dist * 0.018 + phase) * (5 + wH * 4)
        + Math.sin(dist * 0.045 + phase * 1.4) * (2 + wH * 1.5)
        + Math.sin(dist * 0.008 + phase * 0.3) * (8 + wH * 2);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function _drawCausticLight(ctx, w, h, ws, t) {
  var nodes = ws.causticNodes;
  var calm = ws.seaStateIdx < 2;
  var alpha = calm ? 0.1 : 0.06;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var nx = n.x * w + Math.sin(t * n.speed + n.phase) * 25;
    var ny = n.y * h + Math.cos(t * n.speed * 0.8 + n.phase) * 20;
    var r = n.size * Math.min(w, h) * (0.7 + Math.sin(t * n.speed * 2 + n.phase) * 0.4);

    ctx.globalAlpha = alpha * (0.5 + Math.sin(t * n.speed + n.phase * 2) * 0.5);

    var grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, r);
    grad.addColorStop(0, 'rgba(160,210,255,0.8)');
    grad.addColorStop(0.4, 'rgba(120,190,240,0.3)');
    grad.addColorStop(1, 'rgba(80,160,220,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function _drawWindRipples(ctx, w, h, ws, t) {
  var intensity = Math.min(ws.windSpeed / 15, 1.0);
  if (intensity < 0.05) return;

  var seeds = ws.rippleSeeds;
  var angle = ws.windAngle;
  var cosA = Math.cos(angle), sinA = Math.sin(angle);

  ctx.save();
  ctx.strokeStyle = 'rgba(170,210,235,0.5)';
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = intensity * 0.15;

  for (var i = 0; i < seeds.length; i++) {
    var s = seeds[i];
    var sx = (s.x + Math.sin(t * 0.08 + s.phase) * 0.05) * w;
    var sy = (s.y + Math.cos(t * 0.06 + s.phase) * 0.04) * h;
    var len = 10 + intensity * 18;
    var drift = Math.sin(t * 0.3 + s.phase) * 3;

    ctx.beginPath();
    ctx.moveTo(sx, sy + drift);
    ctx.lineTo(sx + cosA * len, sy + sinA * len + drift);
    ctx.stroke();
  }
  ctx.restore();
}

function _drawDepthGlow(ctx, w, h, ws) {
  var idx = ws.seaStateIdx;
  if (idx <= 0) return;

  var glowAlpha = [0, 0.01, 0.025, 0.04, 0.06][Math.min(idx, 4)];
  var grad = ctx.createRadialGradient(w * 0.4, h * 0.5, 0, w * 0.4, h * 0.5, w * 0.6);
  grad.addColorStop(0, 'rgba(20,60,100,' + glowAlpha + ')');
  grad.addColorStop(1, 'rgba(5,15,30,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
