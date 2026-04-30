/**
 * Fleet Map — Weather Layer
 * ==========================
 * Dynamic weather visualization driven by vib3 weather data.
 * Canvas: fleetCanvasWeather (between coast and vessels)
 * Redraws every frame when weather data is present.
 */

var TAU = Math.PI * 2;

export function drawWeather(ctx, w, h, projFn, config, t, weatherData) {
  ctx.clearRect(0, 0, w, h);
  if (!weatherData || !weatherData.regional) return;

  var regional = weatherData.regional;
  _drawWindField(ctx, w, h, regional, config, t);
  _drawPrecip(ctx, w, h, regional, t);
  _drawFogOverlay(ctx, w, h, regional);
  _drawWeatherHUD(ctx, w, h, regional, config, t);

  if (weatherData.zones && weatherData.zones.length) {
    _drawLocalZones(ctx, w, h, projFn, weatherData.zones, config, t);
  }
}

function _drawWindField(ctx, w, h, r, config, t) {
  var speed = r.windSpeed || 0;
  var deg = r.windDeg || 0;
  var angle = deg * Math.PI / 180;
  var intensity = Math.min(speed / 20, 1.0);
  if (intensity < 0.05) return;

  var cols = 10, rows = 7;
  var cw = w / cols, ch = h / rows;
  var len = 10 + intensity * 20;

  ctx.save();
  ctx.strokeStyle = config.colors.creme || '#F0EBE0';
  ctx.lineWidth = 1.2;

  for (var row = 0; row < rows; row++) {
    for (var col = 0; col < cols; col++) {
      var cx = cw * (col + 0.5);
      var cy = ch * (row + 0.5);
      var localA = angle + Math.sin(t * 0.4 + row * 0.9 + col * 0.7) * 0.25;
      var localL = len * (0.6 + Math.sin(t * 0.3 + col * 1.1 + row * 0.8) * 0.4);

      ctx.globalAlpha = intensity * (0.15 + Math.sin(t * 0.2 + row + col) * 0.05);

      var ex = cx + Math.cos(localA) * localL;
      var ey = cy + Math.sin(localA) * localL;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Arrowhead
      var hl = 5;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - Math.cos(localA - 0.45) * hl, ey - Math.sin(localA - 0.45) * hl);
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - Math.cos(localA + 0.45) * hl, ey - Math.sin(localA + 0.45) * hl);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function _drawPrecip(ctx, w, h, r, t) {
  var cond = (r.condition || '').toLowerCase();
  var rain = cond.indexOf('rain') >= 0 || cond.indexOf('drizzle') >= 0;
  var squall = cond.indexOf('squall') >= 0;
  if (!rain && !squall) return;

  var count = squall ? 120 : 50;
  var speed = squall ? 14 : 7;
  var windA = (r.windDeg || 0) * Math.PI / 180;
  var drift = (r.windSpeed || 5) * 0.4;

  ctx.save();
  ctx.globalAlpha = squall ? 0.15 : 0.08;
  ctx.strokeStyle = 'rgba(170,195,215,0.7)';
  ctx.lineWidth = squall ? 0.8 : 0.5;

  for (var i = 0; i < count; i++) {
    var py = ((t * speed + i * 11.3) % (h + 50)) - 25;
    var px = ((i * 31.7 + t * drift) % (w + 30)) - 15;
    var dropL = 5 + (squall ? 8 : 3);

    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(windA) * drift * 0.5, py + dropL);
    ctx.stroke();
  }
  ctx.restore();
}

function _drawFogOverlay(ctx, w, h, r) {
  var vis = r.visibility;
  if (vis === undefined || vis >= 10) return;
  var fog = Math.max(0, 1 - vis / 10) * 0.2;
  ctx.save();
  ctx.fillStyle = 'rgba(160,175,190,' + fog + ')';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function _drawWeatherHUD(ctx, w, h, r, config, t) {
  var fonts = config.fonts;
  var x = 20, y = h - 20;
  var fs = Math.max(9, Math.round(w * 0.008));

  ctx.save();
  ctx.globalAlpha = 0.55;

  // Wind barb
  var wAngle = (r.windDeg || 0) * Math.PI / 180;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, TAU);
  ctx.strokeStyle = config.colors.creme || '#F0EBE0';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  var bx = x + Math.cos(wAngle - Math.PI / 2) * 16;
  var by = y + Math.sin(wAngle - Math.PI / 2) * 16;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(bx, by);
  ctx.stroke();

  // Text
  ctx.font = fs + 'px ' + (fonts.sans || 'sans-serif');
  ctx.fillStyle = config.colors.creme || '#F0EBE0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.round(r.windSpeed || 0) + ' kts ' + (r.windDirection || ''), x + 14, y - 2);

  ctx.globalAlpha = 0.4;
  ctx.fillText((r.seaState || '') + '  ·  ' + (r.condition || ''), x + 14, y + fs + 4);

  // Wave height
  ctx.globalAlpha = 0.3;
  ctx.fillText('Waves ' + (r.waveHeight || 0) + 'm · ' + (r.wavePeriod || 0) + 's', x + 14, y + (fs + 4) * 2);

  ctx.restore();
}

function _drawLocalZones(ctx, w, h, projFn, zones, config, t) {
  ctx.save();
  for (var i = 0; i < zones.length; i++) {
    var z = zones[i];
    if (!z.lat || !z.lon) continue;
    var sp = projFn(z.lat, z.lon);
    var wi = Math.min((z.windSpeed || 0) / 18, 1.0);
    if (wi < 0.3) continue;

    var radius = 20 + wi * 25;
    ctx.globalAlpha = wi * 0.08;
    var grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, radius);
    grad.addColorStop(0, 'rgba(180,160,80,' + (wi * 0.4) + ')');
    grad.addColorStop(1, 'rgba(180,160,80,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, radius, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
