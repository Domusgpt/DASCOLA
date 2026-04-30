/**
 * Vessel Detail Panel
 * ====================
 * Expandable overlay panel that appears when a vessel is clicked on the map.
 * Shows live telemetry, position, catch data, voyage history, and weather
 * conditions at the vessel's location.
 */

export function createVesselDetailPanel(container) {
  var existing = container.querySelector('.vessel-detail-panel');
  if (existing) return existing;

  var panel = document.createElement('div');
  panel.className = 'vessel-detail-panel';
  panel.innerHTML = [
    '<div class="vdp-header">',
    '  <div class="vdp-close">&times;</div>',
    '  <h3 class="vdp-name"></h3>',
    '  <span class="vdp-status-badge"></span>',
    '  <div class="vdp-type"></div>',
    '</div>',
    '<div class="vdp-body">',
    '  <div class="vdp-section vdp-position">',
    '    <div class="vdp-section-title">POSITION</div>',
    '    <div class="vdp-grid">',
    '      <div class="vdp-field"><span class="vdp-label">LAT</span><span class="vdp-value vdp-lat"></span></div>',
    '      <div class="vdp-field"><span class="vdp-label">LON</span><span class="vdp-value vdp-lon"></span></div>',
    '      <div class="vdp-field"><span class="vdp-label">HDG</span><span class="vdp-value vdp-hdg"></span></div>',
    '      <div class="vdp-field"><span class="vdp-label">SPD</span><span class="vdp-value vdp-spd"></span></div>',
    '    </div>',
    '  </div>',
    '  <div class="vdp-section vdp-ops">',
    '    <div class="vdp-section-title">OPERATIONS</div>',
    '    <div class="vdp-grid">',
    '      <div class="vdp-field"><span class="vdp-label">CATCH</span><span class="vdp-value vdp-catch"></span></div>',
    '      <div class="vdp-field"><span class="vdp-label">GEAR</span><span class="vdp-value vdp-gear"></span></div>',
    '      <div class="vdp-field"><span class="vdp-label">MMSI</span><span class="vdp-value vdp-mmsi"></span></div>',
    '      <div class="vdp-field"><span class="vdp-label">TIME</span><span class="vdp-value vdp-time"></span></div>',
    '    </div>',
    '  </div>',
    '  <div class="vdp-section vdp-weather-section">',
    '    <div class="vdp-section-title">LOCAL CONDITIONS</div>',
    '    <div class="vdp-grid">',
    '      <div class="vdp-field"><span class="vdp-label">WIND</span><span class="vdp-value vdp-wind"></span></div>',
    '      <div class="vdp-field"><span class="vdp-label">WAVES</span><span class="vdp-value vdp-waves"></span></div>',
    '      <div class="vdp-field"><span class="vdp-label">VIS</span><span class="vdp-value vdp-vis"></span></div>',
    '      <div class="vdp-field"><span class="vdp-label">TEMP</span><span class="vdp-value vdp-temp"></span></div>',
    '    </div>',
    '  </div>',
    '  <div class="vdp-section vdp-trail-section">',
    '    <div class="vdp-section-title">TRACK HISTORY</div>',
    '    <canvas class="vdp-trail-canvas" width="260" height="80"></canvas>',
    '  </div>',
    '  <div class="vdp-actions">',
    '    <button class="vdp-btn vdp-btn-hail">HAIL</button>',
    '    <button class="vdp-btn vdp-btn-track">TRACK</button>',
    '    <button class="vdp-btn vdp-btn-history">LOG</button>',
    '  </div>',
    '</div>',
  ].join('\n');

  container.appendChild(panel);

  panel.querySelector('.vdp-close').addEventListener('click', function() {
    hideVesselDetail(panel);
  });

  return panel;
}

export function showVesselDetail(panel, vessel, weatherData, screenPos) {
  if (!panel || !vessel) return;

  panel.querySelector('.vdp-name').textContent = vessel.name;

  var badge = panel.querySelector('.vdp-status-badge');
  badge.textContent = vessel.status || 'Unknown';
  badge.className = 'vdp-status-badge vdp-status-' + (vessel.status || '').toLowerCase().replace(/\s+/g, '-');

  panel.querySelector('.vdp-type').textContent = vessel.type || '';

  // Position
  panel.querySelector('.vdp-lat').textContent = _formatCoord(vessel.lat, 'NS');
  panel.querySelector('.vdp-lon').textContent = _formatCoord(vessel.lon, 'EW');
  panel.querySelector('.vdp-hdg').textContent = Math.round(vessel.heading || 0) + '°';
  panel.querySelector('.vdp-spd').textContent = (vessel.speed || 0) + ' kts';

  // Operations
  panel.querySelector('.vdp-catch').textContent = vessel.catch || '—';
  panel.querySelector('.vdp-gear').textContent = _gearType(vessel.type);
  panel.querySelector('.vdp-mmsi').textContent = vessel.mmsi || '—';
  panel.querySelector('.vdp-time').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Weather at vessel location
  var wSection = panel.querySelector('.vdp-weather-section');
  if (weatherData && weatherData.zones) {
    var zone = _findZone(weatherData.zones, vessel.name);
    if (zone) {
      panel.querySelector('.vdp-wind').textContent = zone.windSpeed + ' kts';
      panel.querySelector('.vdp-waves').textContent = zone.waveHeight + ' m';
      panel.querySelector('.vdp-vis').textContent = (zone.visibility || '—') + ' nm';
      panel.querySelector('.vdp-temp').textContent = (weatherData.regional.waterTemp || '—') + '°C';
      wSection.style.display = '';
    } else {
      _fillRegionalWeather(panel, weatherData);
      wSection.style.display = '';
    }
  } else {
    wSection.style.display = 'none';
  }

  // Trail mini-chart
  _drawTrailChart(panel.querySelector('.vdp-trail-canvas'), vessel);

  // Position panel
  var mapEl = panel.closest('.fleet-map');
  if (mapEl && screenPos) {
    var mapRect = mapEl.getBoundingClientRect();
    var panelW = 280;
    var px = screenPos.x + 24;
    if (px + panelW > mapRect.width) px = screenPos.x - panelW - 24;
    if (px < 8) px = 8;
    panel.style.left = px + 'px';
    panel.style.top = '8px';
  }

  panel.classList.add('active');
}

export function hideVesselDetail(panel) {
  if (panel) panel.classList.remove('active');
}

function _formatCoord(val, dirs) {
  var abs = Math.abs(val);
  var deg = Math.floor(abs);
  var min = ((abs - deg) * 60).toFixed(2);
  var dir = val >= 0 ? dirs[0] : dirs[1];
  return deg + '°' + min + "'" + dir;
}

function _gearType(vesselType) {
  var map = {
    'Longliner': 'Longline',
    'Trawler': 'Trawl Net',
    'Gillnetter': 'Gill Net',
    'Scalloper': 'Dredge',
    'Scalloper/Dragger': 'Dredge/Trawl',
    'Scalloper/Longliner': 'Dredge/Line',
  };
  return map[vesselType] || vesselType || '—';
}

function _findZone(zones, vesselName) {
  for (var i = 0; i < zones.length; i++) {
    if (zones[i].vesselName === vesselName) return zones[i];
  }
  return null;
}

function _fillRegionalWeather(panel, weatherData) {
  var r = weatherData.regional;
  panel.querySelector('.vdp-wind').textContent = (r.windSpeed || '—') + ' kts ' + (r.windDirection || '');
  panel.querySelector('.vdp-waves').textContent = (r.waveHeight || '—') + ' m';
  panel.querySelector('.vdp-vis').textContent = (r.visibility || '—') + ' nm';
  panel.querySelector('.vdp-temp').textContent = (r.waterTemp || '—') + '°C';
}

function _drawTrailChart(canvas, vessel) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  var trail = vessel.trail;
  if (!trail || trail.length < 2) {
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(139,175,196,0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('Collecting track data...', w / 2, h / 2);
    return;
  }

  // Plot trail as a mini track
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (var i = 0; i < trail.length; i++) {
    if (trail[i].x < minX) minX = trail[i].x;
    if (trail[i].x > maxX) maxX = trail[i].x;
    if (trail[i].y < minY) minY = trail[i].y;
    if (trail[i].y > maxY) maxY = trail[i].y;
  }

  var rangeX = maxX - minX || 1;
  var rangeY = maxY - minY || 1;
  var pad = 8;

  ctx.beginPath();
  for (i = 0; i < trail.length; i++) {
    var tx = pad + ((trail[i].x - minX) / rangeX) * (w - pad * 2);
    var ty = pad + ((trail[i].y - minY) / rangeY) * (h - pad * 2);
    if (i === 0) ctx.moveTo(tx, ty);
    else ctx.lineTo(tx, ty);
  }
  ctx.strokeStyle = 'rgba(201,168,76,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Current position dot
  var lastT = trail[trail.length - 1];
  var lx = pad + ((lastT.x - minX) / rangeX) * (w - pad * 2);
  var ly = pad + ((lastT.y - minY) / rangeY) * (h - pad * 2);
  ctx.beginPath();
  ctx.arc(lx, ly, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(201,168,76,0.8)';
  ctx.fill();
}
