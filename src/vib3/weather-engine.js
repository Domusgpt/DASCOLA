/**
 * VIB3 — Weather Engine
 * =======================
 * Simulates dynamic weather conditions across the map region.
 * Generates wind, waves, temperature, visibility, and atmospheric
 * conditions that evolve over time.
 *
 * In production, this would be backed by a real weather API
 * (OpenWeatherMap, NOAA, Windy, etc). The simulation provides
 * realistic data patterns for demonstration.
 *
 * Events emitted:
 *   'weather:update'  — Full weather state refreshed
 *   'weather:alert'   — Severe weather condition detected
 */

var CONDITIONS = ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain', 'Fog', 'Storm'];
var CONDITION_WEIGHTS = [0.3, 0.25, 0.2, 0.12, 0.08, 0.05];

export class WeatherEngine {
  constructor(events, config, options) {
    this.events = events;
    this.config = config;
    this.bounds = options.bounds || config.bounds;
    this.refreshMs = options.refreshMs || 30000;

    // Weather state — grid of conditions across the region
    this._state = {
      timestamp: Date.now(),
      globalCondition: 'Clear',
      globalWindSpeed: 8,
      globalWindDirection: 225,
      globalTemperature: 22,
      globalWaveHeight: 1.2,
      globalVisibility: 15000,
      globalPressure: 1013,
      zones: [],
      alerts: [],
    };

    // Internal time for simulation evolution
    this._simTime = Math.random() * 1000;
    this._timer = null;
  }

  start() {
    this._generateWeather();
    var self = this;
    this._timer = setInterval(function () {
      self._generateWeather();
    }, this.refreshMs);
  }

  tick(t) {
    this._simTime += 0.002;
    // Slowly evolve wind direction and speed
    this._state.globalWindDirection = (this._state.globalWindDirection + Math.sin(this._simTime * 0.1) * 0.3) % 360;
    if (this._state.globalWindDirection < 0) this._state.globalWindDirection += 360;
    this._state.globalWindSpeed = Math.max(2, this._state.globalWindSpeed + Math.sin(this._simTime * 0.15) * 0.05);
    this._state.globalWaveHeight = Math.max(0.3, this._state.globalWaveHeight + Math.sin(this._simTime * 0.08) * 0.01);
  }

  /**
   * Get weather conditions at a specific lat/lon.
   */
  getConditionsAt(lat, lon) {
    var s = this._state;
    // Add local variation based on position
    var latFactor = (lat - this.bounds.latS) / (this.bounds.latN - this.bounds.latS);
    var lonFactor = (lon - this.bounds.lonW) / (this.bounds.lonE - this.bounds.lonW);

    var localWind = s.globalWindSpeed + Math.sin(latFactor * 3.14 + this._simTime) * 3;
    var localWave = s.globalWaveHeight + Math.sin(lonFactor * 2.5 + this._simTime * 0.5) * 0.5;
    var localTemp = s.globalTemperature + (latFactor - 0.5) * 4;
    var localVis = s.globalVisibility * (0.7 + Math.cos(latFactor * lonFactor * 5) * 0.3);

    // Determine local condition based on wind/wave severity
    var severity = (localWind / 25) + (localWave / 4);
    var condition;
    if (severity > 1.2) condition = 'Storm';
    else if (severity > 0.8) condition = 'Rain';
    else if (severity > 0.5) condition = 'Cloudy';
    else if (severity > 0.3) condition = 'Partly Cloudy';
    else condition = 'Clear';

    return {
      condition: condition,
      windSpeed: Math.max(0, Math.round(localWind * 10) / 10),
      windDirection: (s.globalWindDirection + Math.sin(latFactor * 5) * 20 + 360) % 360,
      waveHeight: Math.max(0.1, Math.round(localWave * 10) / 10),
      temperature: Math.round(localTemp * 10) / 10,
      visibility: Math.max(500, Math.round(localVis)),
      pressure: s.globalPressure + Math.sin(lonFactor * 4) * 5,
      swellPeriod: 6 + Math.round(localWave * 2),
      swellDirection: (s.globalWindDirection + 10 + 360) % 360,
    };
  }

  getState() {
    return this._state;
  }

  /**
   * Generate new weather data (simulated).
   */
  _generateWeather() {
    var s = this._state;
    s.timestamp = Date.now();

    // Evolve global conditions slowly
    var baseWind = 5 + Math.sin(this._simTime * 0.05) * 8 + Math.random() * 5;
    s.globalWindSpeed = Math.max(2, baseWind);
    s.globalWindDirection = (s.globalWindDirection + (Math.random() - 0.5) * 10 + 360) % 360;
    s.globalWaveHeight = 0.5 + s.globalWindSpeed * 0.12 + Math.random() * 0.5;
    s.globalTemperature = 18 + Math.sin(this._simTime * 0.02) * 6;
    s.globalVisibility = 12000 + Math.sin(this._simTime * 0.03) * 8000;
    s.globalPressure = 1008 + Math.sin(this._simTime * 0.04) * 10;

    // Pick condition based on wind severity
    var windSeverity = s.globalWindSpeed / 25;
    if (windSeverity > 0.7) s.globalCondition = 'Storm';
    else if (windSeverity > 0.5) s.globalCondition = 'Rain';
    else if (windSeverity > 0.35) s.globalCondition = 'Cloudy';
    else if (windSeverity > 0.2) s.globalCondition = 'Partly Cloudy';
    else s.globalCondition = 'Clear';

    // Check for alerts
    s.alerts = [];
    if (s.globalWindSpeed > 20) {
      s.alerts.push({ type: 'GALE WARNING', message: 'Winds exceeding 20 knots' });
    }
    if (s.globalWaveHeight > 3) {
      s.alerts.push({ type: 'HEAVY SEAS', message: 'Wave height exceeding 3m' });
    }
    if (s.globalVisibility < 3000) {
      s.alerts.push({ type: 'FOG ADVISORY', message: 'Visibility below 3km' });
    }

    this.events.emit('weather:update', s);

    if (s.alerts.length > 0) {
      this.events.emit('weather:alert', s.alerts);
    }
  }

  destroy() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this.events = null;
    this.config = null;
    this._state = null;
  }
}
