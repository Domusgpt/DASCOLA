/**
 * Coordination Panel
 * ===================
 * Slide-out panel for fleet coordination and communication.
 * Provides a message log, alert feed, and quick-compose interface
 * for shore-to-vessel and vessel-to-vessel coordination.
 */

export function createCoordinationPanel(container) {
  var wrapper = container.closest('.fleet-map-wrap') || container.parentElement;
  var existing = wrapper.querySelector('.coord-panel');
  if (existing) return existing;

  var panel = document.createElement('div');
  panel.className = 'coord-panel';
  panel.innerHTML = [
    '<div class="coord-header">',
    '  <div class="coord-title">COORDINATION</div>',
    '  <div class="coord-tabs">',
    '    <button class="coord-tab active" data-tab="messages">Messages</button>',
    '    <button class="coord-tab" data-tab="alerts">Alerts</button>',
    '    <button class="coord-tab" data-tab="weather">Weather</button>',
    '  </div>',
    '</div>',
    '<div class="coord-body">',
    '  <div class="coord-tab-content active" data-content="messages">',
    '    <div class="coord-messages"></div>',
    '    <div class="coord-compose">',
    '      <input class="coord-input" type="text" placeholder="Message to fleet...">',
    '      <button class="coord-send">TX</button>',
    '    </div>',
    '  </div>',
    '  <div class="coord-tab-content" data-content="alerts">',
    '    <div class="coord-alerts"></div>',
    '  </div>',
    '  <div class="coord-tab-content" data-content="weather">',
    '    <div class="coord-weather-summary"></div>',
    '  </div>',
    '</div>',
    '<button class="coord-toggle" title="Toggle coordination panel">',
    '  <span class="coord-toggle-icon">&#9776;</span>',
    '  <span class="coord-badge" style="display:none">0</span>',
    '</button>',
  ].join('\n');

  wrapper.appendChild(panel);

  // Tab switching
  var tabs = panel.querySelectorAll('.coord-tab');
  var contents = panel.querySelectorAll('.coord-tab-content');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function() {
      var tabName = this.getAttribute('data-tab');
      for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
      for (var k = 0; k < contents.length; k++) contents[k].classList.remove('active');
      this.classList.add('active');
      var target = panel.querySelector('[data-content="' + tabName + '"]');
      if (target) target.classList.add('active');
    });
  }

  // Toggle panel
  panel.querySelector('.coord-toggle').addEventListener('click', function() {
    panel.classList.toggle('open');
  });

  // Compose
  var input = panel.querySelector('.coord-input');
  var sendBtn = panel.querySelector('.coord-send');
  panel._onSend = null;

  function doSend() {
    var text = input.value.trim();
    if (!text) return;
    if (typeof panel._onSend === 'function') {
      panel._onSend({ from: 'Shore HQ', text: text, type: 'general' });
    }
    input.value = '';
  }

  sendBtn.addEventListener('click', doSend);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doSend();
  });

  return panel;
}

export function updateCoordMessages(panel, messages) {
  if (!panel) return;
  var container = panel.querySelector('.coord-messages');
  if (!container) return;

  container.innerHTML = '';

  var max = Math.min(messages.length, 30);
  for (var i = 0; i < max; i++) {
    var msg = messages[i];
    var el = document.createElement('div');
    el.className = 'coord-msg' + (msg.priority === 'high' ? ' coord-msg-high' : '');

    var time = '';
    try { time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch(e) { time = ''; }

    el.innerHTML = [
      '<div class="coord-msg-header">',
      '  <span class="coord-msg-from">' + _esc(msg.from) + '</span>',
      '  <span class="coord-msg-arrow">&rarr;</span>',
      '  <span class="coord-msg-to">' + _esc(msg.to) + '</span>',
      '  <span class="coord-msg-time">' + time + '</span>',
      '</div>',
      '<div class="coord-msg-text">' + _esc(msg.text) + '</div>',
      '<span class="coord-msg-type">' + _esc(msg.type || '') + '</span>',
    ].join('');

    container.appendChild(el);
  }

  // Scroll to top (newest)
  container.scrollTop = 0;
}

export function updateCoordAlerts(panel, alerts) {
  if (!panel) return;
  var container = panel.querySelector('.coord-alerts');
  if (!container) return;

  container.innerHTML = '';

  for (var i = 0; i < alerts.length; i++) {
    var alert = alerts[i];
    var el = document.createElement('div');
    el.className = 'coord-alert coord-alert-' + (alert.level || 'info');

    var time = '';
    try { time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch(e) {}

    el.innerHTML = [
      '<div class="coord-alert-header">',
      '  <span class="coord-alert-level">' + (alert.level || 'INFO').toUpperCase() + '</span>',
      '  <span class="coord-alert-time">' + time + '</span>',
      '</div>',
      '<div class="coord-alert-text">' + _esc(alert.text) + '</div>',
    ].join('');

    container.appendChild(el);
  }
}

export function updateCoordWeather(panel, weatherData) {
  if (!panel || !weatherData) return;
  var container = panel.querySelector('.coord-weather-summary');
  if (!container) return;

  var r = weatherData.regional || {};
  var rows = [
    ['Condition', r.condition || '—'],
    ['Sea State', r.seaState || '—'],
    ['Wind', (r.windSpeed || 0) + ' kts ' + (r.windDirection || '')],
    ['Waves', (r.waveHeight || 0) + ' m / ' + (r.wavePeriod || 0) + 's period'],
    ['Swell', r.swellDirection || '—'],
    ['Pressure', (r.barometric || 0) + ' hPa'],
    ['Air Temp', (r.temperature || 0) + '°C'],
    ['Water Temp', (r.waterTemp || 0) + '°C'],
    ['Humidity', (r.humidity || 0) + '%'],
    ['Visibility', (r.visibility || 0) + ' nm'],
    ['Sunrise', r.sunrise || '—'],
    ['Sunset', r.sunset || '—'],
  ];

  var html = '<table class="coord-weather-table">';
  for (var i = 0; i < rows.length; i++) {
    html += '<tr><td class="coord-wt-label">' + rows[i][0] + '</td><td class="coord-wt-value">' + rows[i][1] + '</td></tr>';
  }
  html += '</table>';

  // Forecast
  if (weatherData.forecast && weatherData.forecast.length) {
    html += '<div class="coord-forecast-title">FORECAST</div>';
    html += '<div class="coord-forecast-row">';
    for (var f = 0; f < weatherData.forecast.length; f++) {
      var fc = weatherData.forecast[f];
      html += '<div class="coord-forecast-cell">';
      html += '<div class="coord-fc-time">' + (fc.label || '') + '</div>';
      html += '<div class="coord-fc-wind">' + (fc.windSpeed || 0) + ' kts</div>';
      html += '<div class="coord-fc-wave">' + (fc.waveHeight || 0) + ' m</div>';
      html += '<div class="coord-fc-cond">' + (fc.condition || '') + '</div>';
      html += '</div>';
    }
    html += '</div>';
  }

  container.innerHTML = html;
}

export function updateCoordBadge(panel, count) {
  if (!panel) return;
  var badge = panel.querySelector('.coord-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

function _esc(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
