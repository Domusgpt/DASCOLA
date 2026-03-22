/**
 * Fleet Map — Interaction Handler
 * =================================
 * Manages mouse/touch interaction with the fleet map:
 *   - Hover detection over vessel triangles
 *   - Tooltip positioning and content
 *   - Roster item highlighting on hover
 *   - Click callbacks
 *
 * Returns a cleanup function for proper teardown on destroy().
 */

import { highlightRosterItem, clearRosterHighlight } from './roster.js';

var HIT_RADIUS = 18;

/**
 * Find the nearest vessel within HIT_RADIUS of (mx, my).
 *
 * @param {Array}  vessels - Vessel array (each must have _sx, _sy screen coords).
 * @param {number} mx      - Mouse X relative to the fleet-map element.
 * @param {number} my      - Mouse Y relative to the fleet-map element.
 * @returns {{ vessel: Object, index: number }|null}
 */
function hitTest(vessels, mx, my) {
  var best = null;
  var bestDist = HIT_RADIUS + 1;

  for (var i = 0; i < vessels.length; i++) {
    var v = vessels[i];
    if (v._sx == null || v._sy == null) continue;
    var dx = mx - v._sx;
    var dy = my - v._sy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < HIT_RADIUS && dist < bestDist) {
      best = { vessel: v, index: i };
      bestDist = dist;
    }
  }

  return best;
}

/**
 * Set up all mouse/touch interaction on the fleet map.
 *
 * @param {HTMLElement} container - Root container element.
 * @param {Array}       vessels   - Vessel array (mutated in-place with _sx/_sy).
 * @param {Object}      config    - Merged fleet-map configuration.
 * @returns {Function} Cleanup function that removes all event listeners.
 */
export function setupInteraction(container, vessels, config) {
  // Resolve DOM elements
  var canvas   = container.querySelector('#fleetCanvasVessels');
  var tooltip  = container.querySelector('#vesselInfo');
  var viName   = tooltip ? tooltip.querySelector('#viName')   : null;
  var viDetail = tooltip ? tooltip.querySelector('#viDetail') : null;
  var viStatus = tooltip ? tooltip.querySelector('#viStatus') : null;

  var mapEl = container.classList.contains('fleet-map')
    ? container
    : container.querySelector('.fleet-map') || container;

  // ---- Mousemove ----
  function onMousemove(e) {
    var rect = mapEl.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    var hit = hitTest(vessels, mx, my);

    if (hit) {
      // Update tooltip content
      if (viName)   viName.textContent   = hit.vessel.name;
      if (viDetail) {
        var parts = hit.vessel.detail || (hit.vessel.type + ' \u00b7 ' + hit.vessel.speed + ' kts');
        if (!hit.vessel.detail && hit.vessel.catch && hit.vessel.catch !== '\u2014') {
          parts += ' \u00b7 ' + hit.vessel.catch;
        }
        viDetail.textContent = parts;
      }
      if (viStatus) viStatus.textContent = hit.vessel.status || '';

      // Position tooltip near mouse, clamped within map bounds
      if (tooltip) {
        var tipW = tooltip.offsetWidth  || 180;
        var tipH = tooltip.offsetHeight || 80;
        var tx = mx + 16;
        var ty = my - tipH - 8;

        if (tx + tipW > rect.width)  tx = mx - tipW - 16;
        if (ty < 0)                  ty = my + 16;
        if (tx < 0)                  tx = 4;
        if (ty + tipH > rect.height) ty = rect.height - tipH - 4;

        tooltip.style.left = tx + 'px';
        tooltip.style.top  = ty + 'px';
        tooltip.classList.add('active');
      }

      highlightRosterItem(container, hit.index);

      if (typeof config.onVesselHover === 'function') {
        config.onVesselHover(hit.vessel, { x: mx, y: my });
      }
    } else {
      // No hit — hide tooltip and clear roster highlight
      if (tooltip) tooltip.classList.remove('active');
      clearRosterHighlight(container);
    }
  }

  // ---- Mouseleave ----
  function onMouseleave() {
    if (tooltip) tooltip.classList.remove('active');
    clearRosterHighlight(container);
  }

  // ---- Click ----
  function onClick(e) {
    var rect = mapEl.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    var hit = hitTest(vessels, mx, my);

    if (hit && typeof config.onVesselClick === 'function') {
      config.onVesselClick(hit.vessel);
    }
  }

  // Attach listeners
  mapEl.addEventListener('mousemove',  onMousemove);
  mapEl.addEventListener('mouseleave', onMouseleave);
  mapEl.addEventListener('click',      onClick);

  // Return cleanup function
  return function cleanup() {
    mapEl.removeEventListener('mousemove',  onMousemove);
    mapEl.removeEventListener('mouseleave', onMouseleave);
    mapEl.removeEventListener('click',      onClick);
  };
}
