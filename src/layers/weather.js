/**
 * Fleet Map — Weather Overlay Layer
 * ====================================
 * Renders dynamic weather visualization on the map:
 *   - Wind direction arrows across the surface
 *   - Rain/precipitation particles
 *   - Fog zones with reduced visibility
 *   - Storm cells with lightning flashes
 *   - Weather status HUD overlay
 *
 * This layer is driven by the VIB3 WeatherEngine and renders
 * on a dedicated canvas above the atmosphere layer.
 */

var TAU = Math.PI * 2;

/**
 * Draw wind direction indicators across the map.
 */
function drawWindField(ctx, w, h, weather, t) {
  if (!weather) return;

  var windRad = (weather.globalWindDirection || 0) * Math.PI / 180;
  var windStr = (weather.globalWindSpeed || 0) / 25; // 0-1 normalized

  ctx.save();
  ctx.globalAlpha = 0.04 + windStr * 0.04;
  ctx.strokeStyle = 'rgba(139,175,196,1)';
  ctx.lineWidth = 0.8;

  var spacing = 60;
  for (var y = spacing; y < h; y += spacing) {
    for (var x = spacing; x < w; x += spacing) {
      // Add some variation per cell
      var noise = Math.sin(x * 0.01 + y * 0.013 + t * 0.5) * 0.3;
      var localAngle = windRad + noise;
      var len = 8 + windStr * 12;

      var x1 = x - Math.cos(localAngle) * len * 0.5;
      var y1 = y - Math.sin(localAngle) * len * 0.5;
      var x2 = x + Math.cos(localAngle) * len * 0.5;
      var y2 = y + Math.sin(localAngle) * len * 0.5;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      // Arrow head
      var headLen = 3;
      var headAngle = 0.5;
      ctx.lineTo(
        x2 - Math.cos(localAngle - headAngle) * headLen,
        y2 - Math.sin(localAngle - headAngle) * headLen
      );
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - Math.cos(localAngle + headAngle) * headLen,
        y2 - Math.sin(localAngle + headAngle) * headLen
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Draw rain particles when conditions warrant.
 */
function drawRain(ctx, w, h, weather, t, rainParticles) {
  if (!weather) return;
  var condition = weather.globalCondition;
  if (condition !== 'Rain' && condition !== 'Storm') return;

  var intensity = condition === 'Storm' ? 1.0 : 0.5;
  var windAngle = (weather.globalWindDirection || 225) * Math.PI / 180;

  ctx.save();
  ctx.strokeStyle = 'rgba(139,175,196,0.15)';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = intensity * 0.6;

  for (var i = 0; i < rainParticles.length; i++) {
    var p = rainParticles[i];

    // Move rain
    p.x += Math.cos(windAngle) * 2 + p.vx;
    p.y += 3 + p.vy;

    // Reset if off screen
    if (p.y > h + 10 || p.x > w + 10 || p.x < -10) {
      p.x = Math.random() * w * 1.2 - w * 0.1;
      p.y = -10 - Math.random() * 50;
    }

    var len = 4 + p.vy * 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(windAngle) * len, p.y + len);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw fog zones for low visibility conditions.
 */
function drawFog(ctx, w, h, weather, t) {
  if (!weather) return;
  if (weather.globalCondition !== 'Fog' && weather.globalVisibility > 8000) return;

  var fogIntensity = 1 - Math.min(weather.globalVisibility / 15000, 1);
  if (fogIntensity < 0.1) return;

  ctx.save();
  ctx.globalAlpha = fogIntensity * 0.15;

  // Multiple fog bands
  for (var i = 0; i < 3; i++) {
    var y = h * (0.2 + i * 0.3) + Math.sin(t * 0.2 + i * 2) * 30;
    var bandH = h * 0.2;
    var grad = ctx.createLinearGradient(0, y - bandH * 0.5, 0, y + bandH * 0.5);
    grad.addColorStop(0, 'rgba(139,175,196,0)');
    grad.addColorStop(0.5, 'rgba(180,195,210,1)');
    grad.addColorStop(1, 'rgba(139,175,196,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, y - bandH * 0.5, w, bandH);
  }
  ctx.restore();
}

/**
 * Draw weather status HUD in the top-right corner.
 */
function drawWeatherHUD(ctx, w, h, weather, config, t) {
  if (!weather) return;

  var fonts = config.fonts;
  var x = w - 180;
  var y = 20;
  var hudW = 160;
  var hudH = 85;

  ctx.save();

  // Background
  ctx.fillStyle = 'rgba(4,10,16,0.6)';
  ctx.fillRect(x, y, hudW, hudH);
  ctx.strokeStyle = 'rgba(139,175,196,0.15)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, hudW, hudH);

  // Title
  ctx.font = '8px ' + fonts.sans;
  ctx.fillStyle = 'rgba(139,175,196,0.5)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('WEATHER', x + 8, y + 6);

  // Condition icon and text
  var condIcon = '';
  switch (weather.globalCondition) {
    case 'Clear':         condIcon = '\u2600'; break;
    case 'Partly Cloudy': condIcon = '\u26C5'; break;
    case 'Cloudy':        condIcon = '\u2601'; break;
    case 'Rain':          condIcon = '\u2602'; break;
    case 'Storm':         condIcon = '\u26C8'; break;
    case 'Fog':           condIcon = '\u2588'; break;
    default:              condIcon = '\u2600'; break;
  }

  ctx.font = '16px ' + fonts.sans;
  ctx.fillStyle = 'rgba(240,235,224,0.6)';
  ctx.fillText(condIcon, x + 8, y + 18);

  ctx.font = '10px ' + fonts.sans;
  ctx.fillStyle = 'rgba(240,235,224,0.5)';
  ctx.fillText(weather.globalCondition || 'Clear', x + 30, y + 22);

  // Wind
  ctx.font = '8px ' + fonts.sans;
  ctx.fillStyle = 'rgba(139,175,196,0.4)';
  ctx.fillText('WIND ' + Math.round(weather.globalWindSpeed) + ' kts', x + 8, y + 40);

  // Waves
  ctx.fillText('SEAS ' + (weather.globalWaveHeight || 0).toFixed(1) + 'm', x + 8, y + 52);

  // Pressure
  ctx.fillText(Math.round(weather.globalPressure || 1013) + ' hPa', x + 8, y + 64);

  // Visibility
  var visKm = ((weather.globalVisibility || 15000) / 1000).toFixed(1);
  ctx.fillText('VIS ' + visKm + ' km', x + 90, y + 40);

  // Temperature
  ctx.fillText(Math.round(weather.globalTemperature || 22) + '\u00B0C', x + 90, y + 52);

  // Alert indicator
  if (weather.alerts && weather.alerts.length > 0) {
    var pulse = Math.sin(t * 4) * 0.3 + 0.7;
    ctx.fillStyle = 'rgba(201,80,60,' + pulse + ')';
    ctx.beginPath();
    ctx.arc(x + hudW - 12, y + 10, 4, 0, TAU);
    ctx.fill();

    ctx.font = '7px ' + fonts.sans;
    ctx.fillStyle = 'rgba(201,80,60,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(weather.alerts[0].type, x + hudW - 20, y + 68);
  }

  ctx.restore();
}

/**
 * Initialize rain particles.
 */
export function initRainParticles() {
  var particles = [];
  for (var i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * 2000,
      y: Math.random() * 1200,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 1 + Math.random() * 2,
    });
  }
  return particles;
}

/**
 * Main weather layer draw function.
 */
export function drawWeather(ctx, w, h, config, weather, t, rainParticles) {
  ctx.clearRect(0, 0, w, h);

  if (!weather) return;

  drawWindField(ctx, w, h, weather, t);
  drawRain(ctx, w, h, weather, t, rainParticles);
  drawFog(ctx, w, h, weather, t);
  drawWeatherHUD(ctx, w, h, weather, config, t);
}
