/**
 * VIB3 — Fleet Coordination Layer
 * =================================
 * Manages operational communication and coordination between
 * fleet vessels. Provides:
 *
 *   - Fleet-wide status broadcasts
 *   - Vessel-to-vessel message routing
 *   - Operational zone assignments
 *   - Alert propagation
 *   - Activity logging
 *
 * In production this would connect to a real-time messaging
 * backend (WebSocket, SSE, etc). The simulation provides
 * realistic fleet coordination patterns.
 *
 * Events:
 *   'coordination:msg'     — New message in the log
 *   'coordination:alert'   — Urgent fleet alert
 *   'coordination:zone'    — Zone assignment update
 */

var MSG_TYPES = ['position', 'status', 'catch', 'weather', 'operations', 'alert'];

var SIMULATED_MESSAGES = [
  { type: 'operations', text: 'Fleet check-in: all vessels reporting' },
  { type: 'weather', text: 'NOAA update: seas moderate, wind SW 12 kts' },
  { type: 'catch', text: 'Good catch reported in sector 7' },
  { type: 'status', text: 'Vessel returning to port — hold capacity reached' },
  { type: 'operations', text: 'Fuel status check requested by fleet command' },
  { type: 'weather', text: 'Fog advisory for coastal waters after 0400' },
  { type: 'catch', text: 'Catch quota 73% filled — monitoring closely' },
  { type: 'alert', text: 'Vessel requesting assistance — engine trouble' },
  { type: 'operations', text: 'Scheduled maintenance window: Dock B 0600-1200' },
  { type: 'position', text: 'Fleet spread: 42nm max separation' },
  { type: 'weather', text: 'Barometric pressure dropping — monitor conditions' },
  { type: 'catch', text: 'Species migration observed heading NE' },
  { type: 'operations', text: 'Coast Guard channel 16 check complete' },
  { type: 'status', text: 'New vessel joining fleet — ETA 2 hours' },
];

export class Coordination {
  constructor(events, config, vessels) {
    this.events = events;
    this.config = config;
    this.vessels = vessels;

    this._state = {
      messages: [],
      zones: [],
      fleetStatus: 'OPERATIONAL',
      lastUpdate: Date.now(),
      activeAlerts: 0,
    };

    this._msgIndex = 0;
    this._simTime = 0;
    this._nextMsgTime = 0;
    this._indicatorEl = null;
  }

  init() {
    // Generate initial message history
    for (var i = 0; i < 5; i++) {
      this._addSimulatedMessage();
    }

    // Build coordination status indicator on the map
    this._buildIndicator();

    // Generate zone assignments for active vessels
    this._assignZones();
  }

  tick(t) {
    this._simTime += 0.008;

    // Periodically add new messages
    if (this._simTime > this._nextMsgTime) {
      this._addSimulatedMessage();
      this._nextMsgTime = this._simTime + 3 + Math.random() * 8;
    }

    // Update indicator pulse
    if (this._indicatorEl) {
      var pulse = Math.sin(t * 2) * 0.3 + 0.7;
      var dot = this._indicatorEl.querySelector('.vib3-coord-dot');
      if (dot) dot.style.opacity = pulse;
    }
  }

  getState() {
    return this._state;
  }

  getRecentMessages(count) {
    var msgs = this._state.messages;
    var n = Math.min(count || 10, msgs.length);
    return msgs.slice(msgs.length - n);
  }

  _addSimulatedMessage() {
    var template = SIMULATED_MESSAGES[this._msgIndex % SIMULATED_MESSAGES.length];
    this._msgIndex++;

    var msg = {
      id: 'msg-' + Date.now() + '-' + this._msgIndex,
      type: template.type,
      text: template.text,
      timestamp: Date.now(),
      source: 'Fleet Command',
    };

    // Sometimes attribute to a specific vessel
    if (this.vessels && this.vessels.length > 0 && Math.random() > 0.5) {
      var vi = Math.floor(Math.random() * this.vessels.length);
      msg.source = this.vessels[vi].name;
    }

    this._state.messages.push(msg);
    if (this._state.messages.length > 50) {
      this._state.messages.shift();
    }

    this._state.lastUpdate = Date.now();

    if (template.type === 'alert') {
      this._state.activeAlerts++;
      this.events.emit('coordination:alert', msg);
    }

    this.events.emit('coordination:msg', msg);
    this._updateIndicator();
  }

  _assignZones() {
    if (!this.vessels) return;
    this._state.zones = [];

    for (var i = 0; i < this.vessels.length; i++) {
      var v = this.vessels[i];
      if (v.status === 'Fishing' || v.status === 'Scalloping') {
        this._state.zones.push({
          vessel: v.name,
          zone: 'Sector ' + (Math.floor(Math.random() * 12) + 1),
          assigned: Date.now(),
        });
      }
    }

    this.events.emit('coordination:zone', this._state.zones);
  }

  _buildIndicator() {
    var container = this.config._container || document.querySelector('.fleet-map');
    if (!container) {
      // Try the parent passed to FleetMap
      container = document.querySelector('.fleet-map');
    }
    if (!container) return;

    this._indicatorEl = document.createElement('div');
    this._indicatorEl.className = 'vib3-coord-indicator';
    this._indicatorEl.innerHTML =
      '<span class="vib3-coord-dot"></span>' +
      '<span class="vib3-coord-label">FLEET OPS</span>' +
      '<span class="vib3-coord-count">0</span>';

    container.appendChild(this._indicatorEl);

    // Click to show coordination log
    var self = this;
    this._indicatorEl.addEventListener('click', function (e) {
      e.stopPropagation();
      self.events.emit('coordination:toggle', self._state);
    });
  }

  _updateIndicator() {
    if (!this._indicatorEl) return;
    var countEl = this._indicatorEl.querySelector('.vib3-coord-count');
    if (countEl) {
      countEl.textContent = this._state.messages.length;
    }
  }

  destroy() {
    if (this._indicatorEl && this._indicatorEl.parentNode) {
      this._indicatorEl.parentNode.removeChild(this._indicatorEl);
    }
    this._indicatorEl = null;
    this.events = null;
    this.config = null;
    this.vessels = null;
    this._state = null;
  }
}
