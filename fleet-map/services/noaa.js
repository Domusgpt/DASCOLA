// ─────────────────────────────────────────────────────────
//  DASCOLA — NOAA Marine Weather API Client
//  Live weather data from api.weather.gov
// ─────────────────────────────────────────────────────────

import { CONDITION_MAP } from '../assets/symbols/weather.js';

export class NOAAClient {
  /**
   * @param {object} config
   * @param {number} config.refreshMs — polling interval (default 900000 = 15 min)
   * @param {Array} config.stations — array of { lat, lon, name } to fetch weather for
   * @param {string} config.forecastZone — optional NOAA zone ID for warnings
   */
  constructor(config = {}) {
    this.refreshMs = config.refreshMs || 900000;
    this.stations = config.stations || [];
    this.forecastZone = config.forecastZone || null;
    this._timer = null;
    this._cache = new Map();
    this._warnings = [];
  }

  /**
   * Fetch marine forecast for a geographic point
   * Uses api.weather.gov/points → gridpoints → forecast
   */
  async fetchForecast(lat, lon) {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    try {
      // Step 1: Resolve point to forecast office and grid
      const pointRes = await fetch(
        `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers: { 'User-Agent': 'DASCOLA-FleetMap/1.0' } }
      );
      if (!pointRes.ok) return this._cache.get(cacheKey) || null;
      const pointData = await pointRes.json();

      const forecastUrl = pointData.properties.forecast;
      if (!forecastUrl) return this._cache.get(cacheKey) || null;

      // Step 2: Fetch forecast
      const fcRes = await fetch(forecastUrl, {
        headers: { 'User-Agent': 'DASCOLA-FleetMap/1.0' },
      });
      if (!fcRes.ok) return this._cache.get(cacheKey) || null;
      const fcData = await fcRes.json();

      const period = fcData.properties.periods[0];
      if (!period) return null;

      const result = {
        lat, lon,
        wind: {
          speed: parseInt(period.windSpeed) || 0,
          direction: this._parseWindDir(period.windDirection),
          gust: null,
        },
        waves: { height: null, period: null },
        temp: {
          air: period.temperature,
          water: null,
        },
        visibility: null,
        conditions: period.shortForecast,
        conditionSymbol: this._conditionToSymbol(period.shortForecast),
        warnings: [],
        timestamp: Date.now(),
      };

      this._cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[NOAA] Forecast fetch failed:', err.message);
      return this._cache.get(cacheKey) || null;
    }
  }

  /**
   * Fetch active marine warnings for a zone
   */
  async fetchWarnings(zone) {
    zone = zone || this.forecastZone;
    if (!zone) return [];
    try {
      const res = await fetch(
        `https://api.weather.gov/alerts/active?zone=${zone}`,
        { headers: { 'User-Agent': 'DASCOLA-FleetMap/1.0' } }
      );
      if (!res.ok) return this._warnings;
      const data = await res.json();
      this._warnings = (data.features || []).map(f => ({
        event: f.properties.event,
        headline: f.properties.headline,
        severity: f.properties.severity,
        onset: f.properties.onset,
        expires: f.properties.expires,
        description: f.properties.description,
      }));
      return this._warnings;
    } catch (err) {
      console.warn('[NOAA] Warnings fetch failed:', err.message);
      return this._warnings;
    }
  }

  /**
   * Fetch all configured stations
   */
  async fetchAll() {
    const results = [];
    for (const station of this.stations) {
      const data = await this.fetchForecast(station.lat, station.lon);
      if (data) {
        data.name = station.name;
        results.push(data);
      }
    }
    if (this.forecastZone) {
      await this.fetchWarnings();
    }
    return results;
  }

  /**
   * Start polling
   */
  start(callback) {
    this.stop();
    const poll = async () => {
      const data = await this.fetchAll();
      if (callback) callback(data, this._warnings);
    };
    poll();
    this._timer = setInterval(poll, this.refreshMs);
  }

  /**
   * Stop polling
   */
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * Get cached weather data (no fetch)
   */
  getCachedData() {
    return Array.from(this._cache.values());
  }

  /**
   * Get cached warnings
   */
  getCachedWarnings() {
    return this._warnings;
  }

  // ── Helpers ──────────────────────────────────────

  _parseWindDir(dir) {
    const map = {
      N: 0, NNE: 22, NE: 45, ENE: 67,
      E: 90, ESE: 112, SE: 135, SSE: 157,
      S: 180, SSW: 202, SW: 225, WSW: 247,
      W: 270, WNW: 292, NW: 315, NNW: 337,
    };
    return map[dir] || 0;
  }

  _conditionToSymbol(conditions) {
    if (!conditions) return null;
    for (const [key, symbol] of Object.entries(CONDITION_MAP)) {
      if (conditions.includes(key)) return symbol;
    }
    return null;
  }
}
