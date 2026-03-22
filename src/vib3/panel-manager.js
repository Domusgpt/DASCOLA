/**
 * VIB3 — Panel Manager
 * ======================
 * Manages expandable detail panels that slide in when vessels, ports,
 * or weather zones are clicked. Panels are HTML overlays positioned
 * over the map canvas.
 *
 * Panel types:
 *   - Vessel detail: expanded card with live telemetry, heading, speed chart
 *   - Port detail: harbor info, weather, tide data, nearby vessels
 *   - Weather detail: regional conditions, forecast, sea state
 *   - Coordination: fleet messages and operational status
 */

export class PanelManager {
  constructor(container, events, config) {
    this.container = container;
    this.events = events;
    this.config = config;
    this.activePanel = null;
    this._panelEl = null;
    this._backdropEl = null;
  }

  init() {
    // Create the panel overlay container
    var mapEl = this.container.querySelector('.fleet-map') || this.container;

    this._backdropEl = document.createElement('div');
    this._backdropEl.className = 'vib3-panel-backdrop';
    mapEl.appendChild(this._backdropEl);

    this._panelEl = document.createElement('div');
    this._panelEl.className = 'vib3-panel';
    mapEl.appendChild(this._panelEl);

    // Click backdrop to close
    var self = this;
    this._backdropEl.addEventListener('click', function () {
      self.closeAll();
    });
  }

  /**
   * Open an expanded vessel detail panel.
   */
  openVesselPanel(vessel, weather) {
    var colors = this.config.colors;
    var statusClass = this._statusClass(vessel.status);
    var weatherHtml = weather ? this._weatherBlock(weather) : '';
    var coordsStr = Math.abs(vessel.lat).toFixed(3) + '\u00B0' + (vessel.lat >= 0 ? 'N' : 'S') + ', ' +
                    Math.abs(vessel.lon).toFixed(3) + '\u00B0' + (vessel.lon >= 0 ? 'E' : 'W');

    var headingDir = this._headingToCompass(vessel.heading);
    var speedBar = Math.min(vessel.speed / 12, 1) * 100;

    var html =
      '<div class="vib3-panel-header">' +
        '<div class="vib3-panel-icon vessel-icon">' +
          '<svg viewBox="0 0 24 24" width="20" height="20"><polygon points="12,2 6,18 12,14 18,18" fill="currentColor" opacity="0.8"/></svg>' +
        '</div>' +
        '<div class="vib3-panel-title-block">' +
          '<h3 class="vib3-panel-name">' + this._esc(vessel.name) + '</h3>' +
          '<span class="vib3-panel-badge ' + statusClass + '">' + this._esc(vessel.status) + '</span>' +
        '</div>' +
        '<button class="vib3-panel-close" aria-label="Close">&times;</button>' +
      '</div>' +

      '<div class="vib3-panel-body">' +
        // Telemetry grid
        '<div class="vib3-telemetry-grid">' +
          '<div class="vib3-telemetry-item">' +
            '<div class="vib3-telemetry-label">POSITION</div>' +
            '<div class="vib3-telemetry-value">' + coordsStr + '</div>' +
          '</div>' +
          '<div class="vib3-telemetry-item">' +
            '<div class="vib3-telemetry-label">HEADING</div>' +
            '<div class="vib3-telemetry-value">' + Math.round(vessel.heading) + '\u00B0 ' + headingDir + '</div>' +
          '</div>' +
          '<div class="vib3-telemetry-item">' +
            '<div class="vib3-telemetry-label">SPEED</div>' +
            '<div class="vib3-telemetry-value">' + vessel.speed + ' kts' +
              '<div class="vib3-speed-bar"><div class="vib3-speed-fill" style="width:' + speedBar + '%"></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="vib3-telemetry-item">' +
            '<div class="vib3-telemetry-label">TYPE</div>' +
            '<div class="vib3-telemetry-value">' + this._esc(vessel.type) + '</div>' +
          '</div>' +
        '</div>' +

        // Catch info
        (vessel.catch && vessel.catch !== '\u2014' ?
          '<div class="vib3-catch-block">' +
            '<div class="vib3-catch-label">CURRENT CATCH</div>' +
            '<div class="vib3-catch-value">' + this._esc(vessel.catch) + '</div>' +
          '</div>' : '') +

        // MMSI if present
        (vessel.mmsi ?
          '<div class="vib3-mmsi-block">' +
            '<span class="vib3-mmsi-label">MMSI</span> ' +
            '<span class="vib3-mmsi-value">' + this._esc(vessel.mmsi) + '</span>' +
          '</div>' : '') +

        // Weather at vessel position
        weatherHtml +

        // Live indicator
        '<div class="vib3-live-indicator">' +
          '<span class="vib3-live-dot"></span> LIVE TRACKING' +
        '</div>' +
      '</div>';

    this._showPanel(html, 'vessel');
    this.events.emit('panel:open', { type: 'vessel', target: vessel });
  }

  /**
   * Open an expanded port detail panel.
   */
  openPortPanel(port, weather) {
    var weatherHtml = weather ? this._weatherBlock(weather) : '';
    var coordsStr = Math.abs(port.lat).toFixed(3) + '\u00B0' + (port.lat >= 0 ? 'N' : 'S') + ', ' +
                    Math.abs(port.lon).toFixed(3) + '\u00B0' + (port.lon >= 0 ? 'E' : 'W');

    // Simulate tide data
    var now = new Date();
    var tidePhase = Math.sin(now.getHours() * Math.PI / 6);
    var tideHeight = (1.2 + tidePhase * 0.8).toFixed(1);
    var tideState = tidePhase > 0.3 ? 'Rising' : tidePhase < -0.3 ? 'Falling' : 'Slack';
    var nextTide = tidePhase > 0 ? 'High' : 'Low';
    var hoursToTide = Math.round(3 + Math.random() * 3);

    var html =
      '<div class="vib3-panel-header">' +
        '<div class="vib3-panel-icon port-icon">' +
          '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>' +
        '</div>' +
        '<div class="vib3-panel-title-block">' +
          '<h3 class="vib3-panel-name">' + this._esc(port.name) + '</h3>' +
          '<span class="vib3-panel-badge port-badge">' + (port.size === 'major' ? 'MAJOR PORT' : 'PORT') + '</span>' +
        '</div>' +
        '<button class="vib3-panel-close" aria-label="Close">&times;</button>' +
      '</div>' +

      '<div class="vib3-panel-body">' +
        '<div class="vib3-telemetry-grid">' +
          '<div class="vib3-telemetry-item">' +
            '<div class="vib3-telemetry-label">COORDINATES</div>' +
            '<div class="vib3-telemetry-value">' + coordsStr + '</div>' +
          '</div>' +
          '<div class="vib3-telemetry-item">' +
            '<div class="vib3-telemetry-label">TIDE</div>' +
            '<div class="vib3-telemetry-value">' + tideHeight + 'm ' + tideState +
              '<div class="vib3-speed-bar"><div class="vib3-speed-fill vib3-tide-fill" style="width:' + ((parseFloat(tideHeight) / 2.5) * 100) + '%"></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="vib3-telemetry-item">' +
            '<div class="vib3-telemetry-label">NEXT ' + nextTide.toUpperCase() + ' TIDE</div>' +
            '<div class="vib3-telemetry-value">~' + hoursToTide + ' hrs</div>' +
          '</div>' +
          '<div class="vib3-telemetry-item">' +
            '<div class="vib3-telemetry-label">STATUS</div>' +
            '<div class="vib3-telemetry-value vib3-port-open">OPEN</div>' +
          '</div>' +
        '</div>' +

        weatherHtml +

        '<div class="vib3-live-indicator">' +
          '<span class="vib3-live-dot port-dot"></span> PORT ACTIVE' +
        '</div>' +
      '</div>';

    this._showPanel(html, 'port');
    this.events.emit('panel:open', { type: 'port', target: port });
  }

  /**
   * Build weather HTML block for embedding in panels.
   */
  _weatherBlock(weather) {
    var windDir = this._headingToCompass(weather.windDirection || 0);
    var seaStateLabel = ['Calm', 'Slight', 'Moderate', 'Rough', 'Very Rough', 'High'];
    var seaIdx = Math.min(Math.floor((weather.waveHeight || 0) / 0.8), 5);
    var visKm = weather.visibility ? (weather.visibility / 1000).toFixed(1) : '10.0';

    return '<div class="vib3-weather-block">' +
      '<div class="vib3-weather-title">WEATHER CONDITIONS</div>' +
      '<div class="vib3-weather-grid">' +
        '<div class="vib3-weather-item">' +
          '<span class="vib3-weather-icon">' + this._weatherIcon(weather.condition) + '</span>' +
          '<span class="vib3-weather-val">' + Math.round(weather.temperature || 22) + '\u00B0C</span>' +
          '<span class="vib3-weather-lbl">' + (weather.condition || 'Clear') + '</span>' +
        '</div>' +
        '<div class="vib3-weather-item">' +
          '<span class="vib3-weather-icon wind-icon">\u279A</span>' +
          '<span class="vib3-weather-val">' + Math.round(weather.windSpeed || 0) + ' kts ' + windDir + '</span>' +
          '<span class="vib3-weather-lbl">Wind</span>' +
        '</div>' +
        '<div class="vib3-weather-item">' +
          '<span class="vib3-weather-icon">\u2248</span>' +
          '<span class="vib3-weather-val">' + (weather.waveHeight || 0).toFixed(1) + 'm</span>' +
          '<span class="vib3-weather-lbl">' + seaStateLabel[seaIdx] + '</span>' +
        '</div>' +
        '<div class="vib3-weather-item">' +
          '<span class="vib3-weather-icon">\u25CE</span>' +
          '<span class="vib3-weather-val">' + visKm + ' km</span>' +
          '<span class="vib3-weather-lbl">Visibility</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  _weatherIcon(condition) {
    switch (condition) {
      case 'Clear':        return '\u2600';
      case 'Partly Cloudy': return '\u26C5';
      case 'Cloudy':       return '\u2601';
      case 'Rain':         return '\u2602';
      case 'Storm':        return '\u26C8';
      case 'Fog':          return '\u2588';
      default:             return '\u2600';
    }
  }

  /**
   * Show the panel with content.
   */
  _showPanel(html, type) {
    if (!this._panelEl) return;

    this._panelEl.innerHTML = html;
    this._panelEl.className = 'vib3-panel vib3-panel-' + type + ' vib3-panel-active';
    this._backdropEl.classList.add('active');

    // Wire close button
    var self = this;
    var closeBtn = this._panelEl.querySelector('.vib3-panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        self.closeAll();
      });
    }

    this.activePanel = type;
  }

  /**
   * Close all panels.
   */
  closeAll() {
    if (!this._panelEl) return;
    this._panelEl.classList.remove('vib3-panel-active');
    this._backdropEl.classList.remove('active');
    var type = this.activePanel;
    this.activePanel = null;
    this.events.emit('panel:close', { type: type });
  }

  _headingToCompass(deg) {
    var dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
  }

  _statusClass(status) {
    switch (status) {
      case 'Fishing':    return 'badge-fishing';
      case 'In Transit': return 'badge-transit';
      case 'Returning':  return 'badge-returning';
      case 'In Port':    return 'badge-port';
      case 'Scalloping': return 'badge-fishing';
      default:           return 'badge-transit';
    }
  }

  _esc(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    if (this._panelEl && this._panelEl.parentNode) {
      this._panelEl.parentNode.removeChild(this._panelEl);
    }
    if (this._backdropEl && this._backdropEl.parentNode) {
      this._backdropEl.parentNode.removeChild(this._backdropEl);
    }
    this._panelEl = null;
    this._backdropEl = null;
    this.container = null;
    this.events = null;
    this.config = null;
  }
}
