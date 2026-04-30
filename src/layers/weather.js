/**
 * Fleet Map — Weather Layer
 * ==========================
 * Renders dynamic weather visualization driven by vib3 weather data:
 *   - Wind field arrows
 *   - Animated rain/drizzle particles
 *   - Storm cell indicators
 *   - Barometric pressure contours
 *   - Visibility gradient overlay
 *
 * Canvas: fleetCanvasWeather (z-index: 3.5, between coast and vessels)
 * Redraws every frame when weather data is present.
 */

var TAU = Math.PI * 2;

export function drawWeather(ctx, w, h, projFn, config, t, weatherData) {
  ctx.clearRect(0, 0, w, h);
  if (!weatherData || !weatherData.regional) return;

  var regional = weatherData.regional;

  _drawWindField(ctx, w, h, regional, config, t);
  _drawPrecipitation(ctx, w, h, regional, config, t);
  _drawVisibilityOverlay(ctx, w, h, regional, config);
  _drawWeatherIndicator(ctx, w, h, regional, config, t);

  if (weatherData.zones && weatherData.zones.length) {
    _drawZoneConditions(ctx, w, h, projFn, weatherData.zones, config, t);
  }
}

function _drawWindField(ctx, w, h, regional, config, t) {
  var windSpeed = regional.windSpeed || 0;
  var windDeg = regional.windDeg || 0;
  var angle = windDeg * Math.PI / 180;

  var intensity = Math.min(windSpeed / 25, 1.0);
  if (intensity < 0.05) return;

  var cols = 8, rows = 6;
  var cellW = w / cols, cellH = h / rows;
  var arrowLen = 8 + intensity * 16;

  ctx.save();
  ctx.globalAlpha = intensity * 0.18;
  ctx.strokeStyle = config.colors.creme || '#F0EBE0';
  ctx.lineWidth = 1.2;

  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var cx = cellW * (c + 0.5);
      var cy = cellH * (r + 0.5);

      var localAngle = angle + Math.sin(t * 0.5 + r * 0.8 + c * 0.6) * 0.2;
      var localLen = arrowLen * (0.7 + Math.sin(t * 0.3 + c * 1.2 + r) * 0.3);

      var ex = cx + Math.cos(localAngle) * localLen;
      var ey = cy + Math.sin(localAngle) * localLen;

      // Shaft
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Arrowhead
      var headLen = 4;
      var headAngle = 0.5;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - Math.cos(localAngle - headAngle) * headLen,
        ey - Math.sin(localAngle - headAngle) * headLen
      );
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - Math.cos(localAngle + headAngle) * headLen,
        ey - Math.sin(localAngle + headAngle) * headLen
      );
      ctx.stroke();
    }
  }

  ctx.restore();
}

function _drawPrecipitation(ctx, w, h, regional, config, t) {
  var condition = (regional.condition || '').toLowerCase();
  var isRain = condition.indexOf('rain') >= 0 || condition.indexOf('drizzle') >= 0;
  var isSquall = condition.indexOf('squall') >= 0;

  if (!isRain && !isSquall) return;

  var dropCount = isSquall ? 80 : 30;
  var dropSpeed = isSquall ? 12 : 6;
  var windDeg = regional.windDeg || 0;
  var windAngle = windDeg * Math.PI / 180;
  var windDrift = (regional.windSpeed || 5) * 0.3;

  ctx.save();
  ctx.globalAlpha = isSquall ? 0.12 : 0.06;
  ctx.strokeStyle = 'rgba(180,200,220,0.7)';
  ctx.lineWidth = 0.6;

  for (var i = 0; i < dropCount; i++) {
    var phase = (t * dropSpeed + i * 13.7) % (h + 40);
    var x = ((i * 37.1 + t * windDrift) % (w + 20)) - 10;
    var y = phase - 20;
    var len = 4 + (isSquall ? 6 : 2);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(windAngle) * windDrift, y + len);
    ctx.stroke();
  }

  ctx.restore();
}

function _drawVisibilityOverlay(ctx, w, h, regional, config) {
  var vis = regional.visibility;
  if (vis === undefined || vis >= 10) return;

  var fogIntensity = Math.max(0, 1 - vis / 10) * 0.15;

  ctx.save();
  ctx.fillStyle = 'rgba(180,190,200,' + fogIntensity + ')';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function _drawWeatherIndicator(ctx, w, h, regional, config, t) {
  var x = 24;
  var y = h - 24;
  var fonts = config.fonts;

  ctx.save();
  ctx.globalAlpha = 0.5;

  // Wind barb symbol
  var windDeg = regional.windDeg || 0;
  var windAngle = windDeg * Math.PI / 180;
  var windSpeed = regional.windSpeed || 0;
  var barbLen = 18;

  ctx.beginPath();
  ctx.arc(x, y, 4, 0, TAU);
  ctx.strokeStyle = config.colors.creme || '#F0EBE0';
  ctx.lineWidth = 1;
  ctx.stroke();

  var bx = x + Math.cos(windAngle - Math.PI / 2) * barbLen;
  var by = y + Math.sin(windAngle - Math.PI / 2) * barbLen;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(bx, by);
  ctx.stroke();

  // Wind speed text
  var fontSize = Math.max(8, Math.round(w * 0.007));
  ctx.font = fontSize + 'px ' + (fonts.sans || 'sans-serif');
  ctx.fillStyle = config.colors.creme || '#F0EBE0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.round(windSpeed) + ' kts ' + (regional.windDirection || ''), x + 12, y);

  // Sea state
  ctx.globalAlpha = 0.25;
  ctx.fillText((regional.seaState || '') + ' · ' + (regional.condition || ''), x + 12, y + fontSize + 4);

  ctx.restore();
}

function _drawZoneConditions(ctx, w, h, projFn, zones, config, t) {
  ctx.save();
  ctx.globalAlpha = 0.08;

  for (var i = 0; i < zones.length; i++) {
    var z = zones[i];
    if (!z.lat || !z.lon) continue;

    var sp = projFn(z.lat, z.lon);
    var windIntensity = Math.min((z.windSpeed || 0) / 20, 1.0);
    var radius = 15 + windIntensity * 20;

    if (windIntensity > 0.5) {
      var grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, radius);
      grad.addColorStop(0, 'rgba(200,180,100,' + (windIntensity * 0.3) + ')');
      grad.addColorStop(1, 'rgba(200,180,100,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, radius, 0, TAU);
      ctx.fill();
    }
  }

  ctx.restore();
}
