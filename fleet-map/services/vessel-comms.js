// ─────────────────────────────────────────────────────────
//  DASCOLA — Vessel Communications (Future)
//  Stub for captain's log, messaging, and fleet coordination
// ─────────────────────────────────────────────────────────

/**
 * VesselComms — future hook for:
 * - Captain's log entries (text messages from vessel to fleet manager)
 * - Fleet-wide broadcasts
 * - Position-tagged messages
 * - Message read receipts
 *
 * Currently a no-op stub. Will integrate with a WebSocket or
 * polling endpoint when the backend is ready.
 */
export class VesselComms {
  constructor(config = {}) {
    this.endpoint = config.endpoint || null;
    this.messages = [];
    this._timer = null;
  }

  /**
   * Submit a captain's log entry
   * @param {string} vesselId
   * @param {string} message
   * @param {object} position — { lat, lon }
   */
  async sendLog(vesselId, message, position) {
    const entry = {
      vesselId,
      message,
      position,
      timestamp: Date.now(),
      type: 'log',
    };
    this.messages.push(entry);
    if (this.endpoint) {
      // Future: POST to endpoint
    }
    return entry;
  }

  /**
   * Get messages for a vessel
   */
  getMessages(vesselId) {
    if (!vesselId) return this.messages;
    return this.messages.filter(m => m.vesselId === vesselId);
  }

  /**
   * Start polling for incoming messages
   */
  start(callback) {
    // Future: poll endpoint
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}
