/**
 * VIB3 — Event Bus
 * =================
 * Lightweight pub/sub event system for cross-component communication.
 * All VIB3 subsystems communicate through this bus rather than
 * holding direct references to each other.
 *
 * Events follow a namespace pattern:
 *   'vessel:click'       — A vessel was clicked on the map
 *   'port:click'         — A port marker was clicked
 *   'weather:update'     — Weather data refreshed
 *   'coordination:msg'   — Fleet coordination message
 *   'panel:open'         — A detail panel opened
 *   'panel:close'        — A detail panel closed
 *   'vib3:ready'         — VIB3 system initialized
 */

export class EventBus {
  constructor() {
    this._listeners = {};
    this._history = [];
    this._maxHistory = 50;
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {function} fn
   * @returns {function} Unsubscribe function
   */
  on(event, fn) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(fn);

    var self = this;
    return function () {
      self.off(event, fn);
    };
  }

  /**
   * Subscribe to an event, but only fire once.
   */
  once(event, fn) {
    var self = this;
    var wrapped = function (data) {
      self.off(event, wrapped);
      fn(data);
    };
    this.on(event, wrapped);
  }

  /**
   * Unsubscribe from an event.
   */
  off(event, fn) {
    if (!this._listeners[event]) return;
    var arr = this._listeners[event];
    for (var i = arr.length - 1; i >= 0; i--) {
      if (arr[i] === fn) {
        arr.splice(i, 1);
      }
    }
  }

  /**
   * Emit an event with data.
   */
  emit(event, data) {
    // Record in history
    this._history.push({ event: event, data: data, time: Date.now() });
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    if (!this._listeners[event]) return;
    var arr = this._listeners[event].slice(); // copy to avoid mutation issues
    for (var i = 0; i < arr.length; i++) {
      try {
        arr[i](data);
      } catch (e) {
        console.warn('[VIB3 EventBus] Error in listener for "' + event + '":', e);
      }
    }
  }

  /**
   * Get recent event history.
   */
  getHistory(filterEvent) {
    if (!filterEvent) return this._history.slice();
    var out = [];
    for (var i = 0; i < this._history.length; i++) {
      if (this._history[i].event === filterEvent) {
        out.push(this._history[i]);
      }
    }
    return out;
  }

  /**
   * Clear all listeners and history.
   */
  clear() {
    this._listeners = {};
    this._history = [];
  }
}
