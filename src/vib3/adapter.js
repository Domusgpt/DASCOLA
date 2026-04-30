/**
 * vib3 SDK — Adapter Layer
 * =========================
 * Integration backbone that bridges the Fleet Map system with the vib3
 * real-time maritime data SDK. Provides a unified event bus, data
 * normalization, and live-stream subscriptions for:
 *   - Vessel telemetry (AIS, GPS, engine data)
 *   - Weather conditions (wind, waves, barometric pressure)
 *   - Port operations (berth availability, tidal schedules)
 *   - Coordination messages (fleet-to-fleet, shore-to-vessel)
 *
 * The adapter is designed as a pluggable layer: when no live vib3
 * endpoint is configured, it generates realistic simulated data
 * so the UI is always functional.
 */

var EVENT_TYPES = {
  VESSEL_UPDATE:   'vib3:vessel:update',
  WEATHER_UPDATE:  'vib3:weather:update',
  PORT_UPDATE:     'vib3:port:update',
  COORD_MESSAGE:   'vib3:coord:message',
  ALERT:           'vib3:alert',
  CONNECTION:      'vib3:connection',
};

export { EVENT_TYPES };

export class Vib3Adapter {
  constructor(config) {
    this.config = config || {};
    this.endpoint = config.vib3Endpoint || null;
    this.apiKey = config.vib3ApiKey || null;
    this.listeners = {};
    this.connected = false;
    this._pollTimer = null;
    this._simTimer = null;
    this._weatherCache = null;
    this._portCache = {};
    this._coordLog = [];
    this._alerts = [];
  }

  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
    return this;
  }

  off(event, fn) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(function(f) { return f !== fn; });
  }

  emit(event, data) {
    var fns = this.listeners[event];
    if (!fns) return;
    for (var i = 0; i < fns.length; i++) {
      try { fns[i](data); } catch(e) { /* swallow listener errors */ }
    }
  }

  start(vessels, ports) {
    this.connected = true;
    this.emit(EVENT_TYPES.CONNECTION, { status: 'connected', mode: this.endpoint ? 'live' : 'simulated' });

    if (this.endpoint) {
      this._startLivePolling(vessels, ports);
    } else {
      this._startSimulation(vessels, ports);
    }
  }

  stop() {
    this.connected = false;
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this._simTimer) { clearInterval(this._simTimer); this._simTimer = null; }
    this.emit(EVENT_TYPES.CONNECTION, { status: 'disconnected' });
  }

  destroy() {
    this.stop();
    this.listeners = {};
    this._weatherCache = null;
    this._portCache = {};
    this._coordLog = [];
    this._alerts = [];
  }

  getWeather() { return this._weatherCache; }
  getPortData(portName) { return this._portCache[portName] || null; }
  getCoordLog() { return this._coordLog.slice(); }
  getAlerts() { return this._alerts.slice(); }

  sendCoordMessage(msg) {
    var entry = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      from: msg.from || 'Shore HQ',
      to: msg.to || 'All Vessels',
      type: msg.type || 'general',
      priority: msg.priority || 'normal',
      text: msg.text || '',
      acknowledged: false,
    };
    this._coordLog.unshift(entry);
    if (this._coordLog.length > 100) this._coordLog.length = 100;
    this.emit(EVENT_TYPES.COORD_MESSAGE, entry);
    return entry;
  }

  // --- Live polling (when vib3 endpoint is configured) ---

  _startLivePolling(vessels, ports) {
    var self = this;
    var interval = this.config.vib3PollMs || 30000;

    function poll() {
      self._fetchWeather();
      self._fetchPorts(ports);
      self._fetchAlerts();
    }

    poll();
    this._pollTimer = setInterval(poll, interval);
  }

  _fetchWeather() {
    var self = this;
    fetch(this.endpoint + '/weather', {
      headers: this.apiKey ? { 'Authorization': 'Bearer ' + this.apiKey } : {}
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      self._weatherCache = self._normalizeWeather(data);
      self.emit(EVENT_TYPES.WEATHER_UPDATE, self._weatherCache);
    })
    .catch(function() { /* silent retry next cycle */ });
  }

  _fetchPorts(ports) {
    var self = this;
    if (!ports || !ports.length) return;
    fetch(this.endpoint + '/ports', {
      headers: this.apiKey ? { 'Authorization': 'Bearer ' + this.apiKey } : {}
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (Array.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          var pd = self._normalizePort(data[i]);
          self._portCache[pd.name] = pd;
        }
      }
      self.emit(EVENT_TYPES.PORT_UPDATE, self._portCache);
    })
    .catch(function() {});
  }

  _fetchAlerts() {
    var self = this;
    fetch(this.endpoint + '/alerts', {
      headers: this.apiKey ? { 'Authorization': 'Bearer ' + this.apiKey } : {}
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (Array.isArray(data)) {
        self._alerts = data;
        for (var i = 0; i < data.length; i++) {
          self.emit(EVENT_TYPES.ALERT, data[i]);
        }
      }
    })
    .catch(function() {});
  }

  // --- Simulated data (no endpoint) ---

  _startSimulation(vessels, ports) {
    var self = this;
    this._generateWeather(vessels);
    this._generatePortData(ports);
    this._generateCoordMessages(vessels);

    this._simTimer = setInterval(function() {
      self._generateWeather(vessels);
      self._generatePortData(ports);
      if (Math.random() < 0.15) self._generateCoordMessages(vessels);
      if (Math.random() < 0.05) self._generateAlert(vessels);
    }, 15000);
  }

  _generateWeather(vessels) {
    var now = Date.now();
    var hour = new Date().getHours();
    var baseWind = 8 + Math.sin(now * 0.00001) * 6;
    var baseWaveH = 0.8 + Math.sin(now * 0.000008) * 1.2;
    var basePressure = 1013 + Math.sin(now * 0.000005) * 8;
    var baseTemp = 22 + Math.sin(now * 0.000012) * 4;

    var conditions = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Squall'];
    var condIdx = Math.floor((Math.sin(now * 0.000003) + 1) * 2.4);
    if (condIdx >= conditions.length) condIdx = conditions.length - 1;

    var seaStates = ['Calm', 'Smooth', 'Slight', 'Moderate', 'Rough'];
    var seaIdx = Math.min(Math.floor(baseWaveH / 0.8), seaStates.length - 1);

    var windDirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    var windDirIdx = Math.floor((Math.sin(now * 0.000002) + 1) * 8) % 16;

    var zones = [];
    if (vessels) {
      for (var i = 0; i < vessels.length; i++) {
        var v = vessels[i];
        var localWind = baseWind + (Math.sin(v.lat * 0.5 + now * 0.00001) * 3);
        var localWave = baseWaveH + (Math.sin(v.lon * 0.3 + now * 0.000007) * 0.5);
        zones.push({
          vesselName: v.name,
          lat: v.lat, lon: v.lon,
          windSpeed: Math.round(localWind * 10) / 10,
          waveHeight: Math.round(localWave * 10) / 10,
          visibility: Math.round((8 + Math.sin(i + now * 0.00001) * 4) * 10) / 10,
        });
      }
    }

    this._weatherCache = {
      timestamp: new Date().toISOString(),
      regional: {
        windSpeed: Math.round(baseWind * 10) / 10,
        windDirection: windDirs[windDirIdx],
        windDeg: windDirIdx * 22.5,
        waveHeight: Math.round(baseWaveH * 10) / 10,
        wavePeriod: Math.round((6 + Math.sin(now * 0.000006) * 3) * 10) / 10,
        swellDirection: windDirs[(windDirIdx + 4) % 16],
        barometric: Math.round(basePressure * 10) / 10,
        temperature: Math.round(baseTemp * 10) / 10,
        waterTemp: Math.round((baseTemp - 3) * 10) / 10,
        humidity: Math.round(65 + Math.sin(now * 0.00001) * 15),
        condition: conditions[condIdx],
        seaState: seaStates[seaIdx],
        visibility: Math.round((10 + Math.sin(now * 0.000009) * 5) * 10) / 10,
        sunrise: '05:' + (42 + Math.floor(Math.sin(now * 0.0000001) * 10)).toString().padStart(2, '0'),
        sunset: '18:' + (15 + Math.floor(Math.sin(now * 0.0000001) * 12)).toString().padStart(2, '0'),
      },
      zones: zones,
      forecast: this._generateForecast(),
    };

    this.emit(EVENT_TYPES.WEATHER_UPDATE, this._weatherCache);
  }

  _generateForecast() {
    var periods = [];
    var now = Date.now();
    for (var i = 0; i < 5; i++) {
      var offset = i * 6;
      var t = new Date(now + offset * 3600000);
      var windDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      periods.push({
        time: t.toISOString(),
        label: '+' + offset + 'h',
        windSpeed: Math.round((8 + Math.sin(i * 1.3) * 5) * 10) / 10,
        windDir: windDirs[Math.floor(Math.random() * windDirs.length)],
        waveHeight: Math.round((1.0 + Math.sin(i * 0.9) * 0.8) * 10) / 10,
        condition: ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain'][Math.floor(Math.random() * 4)],
      });
    }
    return periods;
  }

  _generatePortData(ports) {
    if (!ports || !ports.length) return;
    var now = Date.now();

    for (var i = 0; i < ports.length; i++) {
      var port = ports[i];
      var tideCycle = Math.sin(now * 0.0000015 + i * 2.1);
      var tideH = 1.5 + tideCycle * 1.2;
      var tideState = tideCycle > 0.3 ? 'Rising' : tideCycle < -0.3 ? 'Falling' : (tideCycle > 0 ? 'High Slack' : 'Low Slack');

      var totalBerths = port.size === 'major' ? 12 : 4;
      var occupied = Math.floor(totalBerths * (0.4 + Math.sin(now * 0.000001 + i) * 0.3));
      if (occupied < 0) occupied = 0;
      if (occupied > totalBerths) occupied = totalBerths;

      this._portCache[port.name] = {
        name: port.name,
        lat: port.lat,
        lon: port.lon,
        size: port.size,
        tideHeight: Math.round(tideH * 100) / 100,
        tideState: tideState,
        nextHighTide: new Date(now + (2 - tideCycle) * 3600000).toISOString(),
        nextLowTide: new Date(now + (5 - tideCycle) * 3600000).toISOString(),
        totalBerths: totalBerths,
        occupiedBerths: occupied,
        availableBerths: totalBerths - occupied,
        fuelAvailable: Math.random() > 0.1,
        iceAvailable: Math.random() > 0.05,
        harbormaster: port.size === 'major' ? 'Ch. 16/12' : 'Ch. 16',
        restrictions: occupied >= totalBerths ? 'Full — standby for berth' : 'Open',
        lastUpdated: new Date().toISOString(),
      };
    }

    this.emit(EVENT_TYPES.PORT_UPDATE, this._portCache);
  }

  _generateCoordMessages(vessels) {
    var templates = [
      { from: 'Shore HQ', type: 'ops', text: 'Weather advisory: wind increasing to {wind} kts from SW. Secure all deck gear.' },
      { from: 'Shore HQ', type: 'ops', text: 'Market update: {catch} prices up 12% at dock. Prioritize full holds.' },
      { from: '{vessel}', type: 'report', text: 'Position report: on station, {speed} kts, gear deployed. ETA next set 0400.' },
      { from: '{vessel}', type: 'report', text: 'Good haul this set. Holding position for next drift.' },
      { from: 'Shore HQ', type: 'logistics', text: 'Fuel barge available at Santos 0600-1800 tomorrow. Reserve via Ch. 12.' },
      { from: '{vessel}', type: 'safety', text: 'All hands safe. Running from squall, repositioning 15nm east.' },
      { from: 'Coast Guard', type: 'advisory', text: 'NAVTEX: Unlit fishing buoys reported vicinity {lat}S {lon}W. Exercise caution.' },
    ];

    if (!vessels || !vessels.length) return;
    var tmpl = templates[Math.floor(Math.random() * templates.length)];
    var v = vessels[Math.floor(Math.random() * vessels.length)];

    var text = tmpl.text
      .replace('{vessel}', v.name)
      .replace('{speed}', v.speed)
      .replace('{catch}', v.catch || 'Fish')
      .replace('{wind}', Math.round(8 + Math.random() * 12))
      .replace('{lat}', Math.abs(Math.round(v.lat * 10) / 10))
      .replace('{lon}', Math.abs(Math.round(v.lon * 10) / 10));

    var from = tmpl.from.replace('{vessel}', v.name);

    this.sendCoordMessage({
      from: from,
      to: from === 'Shore HQ' || from === 'Coast Guard' ? 'All Vessels' : 'Shore HQ',
      type: tmpl.type,
      priority: tmpl.type === 'safety' ? 'high' : 'normal',
      text: text,
    });
  }

  _generateAlert(vessels) {
    var alertTypes = [
      { level: 'info', text: 'Scheduled maintenance: Santos port crane #3 offline 0800-1200 tomorrow.' },
      { level: 'warning', text: 'Small craft advisory in effect. Winds 15-25 kts expected next 6 hours.' },
      { level: 'info', text: 'Fishing zone B22 reopened after seasonal closure. Good reports from first boats.' },
    ];

    var alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    var entry = {
      id: 'alert-' + Date.now(),
      timestamp: new Date().toISOString(),
      level: alert.level,
      text: alert.text,
      acknowledged: false,
    };

    this._alerts.unshift(entry);
    if (this._alerts.length > 20) this._alerts.length = 20;
    this.emit(EVENT_TYPES.ALERT, entry);
  }

  // --- Data normalization ---

  _normalizeWeather(raw) {
    return {
      timestamp: raw.timestamp || new Date().toISOString(),
      regional: {
        windSpeed: raw.wind_speed || raw.windSpeed || 0,
        windDirection: raw.wind_dir || raw.windDirection || 'N',
        windDeg: raw.wind_deg || 0,
        waveHeight: raw.wave_height || raw.waveHeight || 0,
        wavePeriod: raw.wave_period || raw.wavePeriod || 0,
        barometric: raw.pressure || raw.barometric || 1013,
        temperature: raw.temp || raw.temperature || 20,
        waterTemp: raw.water_temp || raw.waterTemp || 18,
        condition: raw.condition || 'Unknown',
        seaState: raw.sea_state || raw.seaState || 'Unknown',
        visibility: raw.visibility || 10,
      },
      zones: raw.zones || [],
      forecast: raw.forecast || [],
    };
  }

  _normalizePort(raw) {
    return {
      name: raw.name || 'Unknown',
      lat: raw.lat || 0,
      lon: raw.lon || 0,
      tideHeight: raw.tide_height || raw.tideHeight || 0,
      tideState: raw.tide_state || raw.tideState || 'Unknown',
      totalBerths: raw.total_berths || raw.totalBerths || 0,
      occupiedBerths: raw.occupied_berths || raw.occupiedBerths || 0,
      availableBerths: raw.available_berths || raw.availableBerths || 0,
      restrictions: raw.restrictions || 'Unknown',
      lastUpdated: raw.last_updated || new Date().toISOString(),
    };
  }
}
