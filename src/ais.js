/**
 * Fleet Map — AIS Client
 * ========================
 * Polls an AIS (Automatic Identification System) endpoint
 * for live vessel positions.
 *
 * Expected API response format (JSON):
 *   [
 *     {
 *       "mmsi": "710012345",
 *       "lat": -24.2,
 *       "lon": -44.8,
 *       "heading": 135,
 *       "speed": 7.2,
 *       "name": "São Jorge",        // optional
 *       "status": "Fishing",         // optional
 *       "timestamp": "2024-01-15T..." // optional
 *     }
 *   ]
 *
 * When no AIS endpoint is configured, the system uses simulated
 * vessel drift (small sinusoidal position wobble) instead.
 *
 * Integration with a vessel management dashboard:
 *   The dashboard would POST updated vessel data to your API,
 *   and this client would fetch it on the configured interval.
 *   Alternatively, call fleetMap.updateVessels() directly from
 *   dashboard JS to bypass AIS entirely.
 */

var DEFAULT_REFRESH_MS = 60000;
var FETCH_TIMEOUT_MS   = 10000;

/**
 * AIS polling client.
 *
 * @param {Object}   config   - Merged fleet-map configuration.
 * @param {Array}    vessels  - Live vessels array (mutated in-place on update).
 * @param {Function} onUpdate - Callback invoked after positions are merged.
 */
export class AISClient {
  constructor(config, vessels, onUpdate) {
    this.endpoint  = config.aisEndpoint || null;
    this.refreshMs = config.aisRefreshMs || DEFAULT_REFRESH_MS;
    this.vessels   = vessels;
    this.onUpdate  = onUpdate;
    this.timer     = null;
    this.lastFetch = null;
  }

  /**
   * Start polling. Performs an immediate fetch, then repeats on interval.
   */
  start() {
    var self = this;
    self.fetch();
    self.timer = setInterval(function () {
      self.fetch();
    }, self.refreshMs);
  }

  /**
   * Stop polling (does not clear references).
   */
  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Perform a single AIS fetch cycle.
   * Merges returned positions into the vessels array by MMSI match.
   */
  fetch() {
    if (!this.endpoint) return;

    var self = this;

    // Collect MMSIs from vessels that have them
    var mmsiList = [];
    for (var i = 0; i < self.vessels.length; i++) {
      if (self.vessels[i].mmsi) {
        mmsiList.push(self.vessels[i].mmsi);
      }
    }

    // Build URL with MMSI query params
    var url = self.endpoint;
    if (mmsiList.length > 0) {
      var separator = url.indexOf('?') === -1 ? '?' : '&';
      url += separator + 'mmsi=' + mmsiList.join(',');
    }

    // Create an AbortController for the timeout
    var controller = typeof AbortController !== 'undefined'
      ? new AbortController()
      : null;
    var timeoutId = null;

    if (controller) {
      timeoutId = setTimeout(function () {
        controller.abort();
      }, FETCH_TIMEOUT_MS);
    }

    var fetchOptions = {};
    if (controller) {
      fetchOptions.signal = controller.signal;
    }

    window.fetch(url, fetchOptions)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('AIS fetch failed: HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (timeoutId !== null) clearTimeout(timeoutId);

        if (!Array.isArray(data)) return;

        // Build a lookup from incoming data keyed by MMSI
        var incoming = {};
        for (var d = 0; d < data.length; d++) {
          var rec = data[d];
          if (rec.mmsi) {
            incoming[String(rec.mmsi)] = rec;
          }
        }

        // Merge into local vessels array
        for (var v = 0; v < self.vessels.length; v++) {
          var vessel = self.vessels[v];
          if (!vessel.mmsi) continue;

          var update = incoming[String(vessel.mmsi)];
          if (!update) continue;

          if (update.lat != null)     vessel.lat     = update.lat;
          if (update.lon != null)     vessel.lon     = update.lon;
          if (update.heading != null) vessel.heading = update.heading;
          if (update.speed != null)   vessel.speed   = update.speed;
          if (update.status)          vessel.status  = update.status;

          vessel.lastUpdate = update.timestamp || new Date().toISOString();
        }

        self.lastFetch = new Date();

        if (typeof self.onUpdate === 'function') {
          self.onUpdate(self.vessels);
        }
      })
      .catch(function (err) {
        if (timeoutId !== null) clearTimeout(timeoutId);
        console.warn('[AISClient] Fetch error:', err.message || err);
      });
  }

  /**
   * Full teardown — stop polling and release references.
   */
  destroy() {
    this.stop();
    this.vessels  = null;
    this.onUpdate = null;
    this.endpoint = null;
  }
}
