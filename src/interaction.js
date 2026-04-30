/**
 * Fleet Map — Interaction Handler
 * =================================
 * Manages mouse/touch interaction with the fleet map:
 *   - Hover detection over vessel triangles and port markers
 *   - Tooltip positioning and content
 *   - Roster item highlighting on hover
 *   - Click callbacks for vessels, ports, and empty map area
 *   - Expandable detail panel triggers
 *
 * Returns a cleanup function for proper teardown on destroy().
 */

import { highlightRosterItem, clearRosterHighlight } from './roster.js';

var HIT_RADIUS = 18;
var PORT_HIT_RADIUS = 14;

/**
 * Find the nearest vessel within HIT_RADIUS of (mx, my).
 */
function hitTestVessel(vessels, mx, my) {
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
 * Find the nearest port within PORT_HIT_RADIUS of (mx, my).
 */
function hitTestPort(ports, projFn, mx, my) {
  if (!ports || !ports.length || !projFn) return null;

  var best = null;
  var bestDist = PORT_HIT_RADIUS + 1;

  for (var i = 0; i < ports.length; i++) {
    var p = ports[i];
    var sp = projFn(p.lat, p.lon);
    var dx = mx - sp.x;
    var dy = my - sp.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < PORT_HIT_RADIUS && dist < bestDist) {
      best = { port: p, index: i, screenPos: sp };
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
  var canvas   = container.querySelector('#fleetCanvasVessels');
  var tooltip  = container.querySelector('#vesselInfo');
  var viName   = tooltip ? tooltip.querySelector('#viName')   : null;
  var viDetail = tooltip ? tooltip.querySelector('#viDetail') : null;
  var viStatus = tooltip ? tooltip.querySelector('#viStatus') : null;

  var mapEl = container.classList.contains('fleet-map')
    ? container
    : container.querySelector('.fleet-map') || container;

  // Roster items live in a sibling element, not inside the map
  var rosterScope = config._rosterScope
    || container.closest('.fleet-map-panel-wrap')
    || container.parentElement || container;

  // ---- Mousemove ----
  function onMousemove(e) {
    var rect = mapEl.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    var hit = hitTestVessel(vessels, mx, my);

    if (hit) {
      // Update tooltip content
      if (viName)   viName.textContent   = hit.vessel.name;
      if (viDetail) {
        var parts = hit.vessel.type + ' · ' + hit.vessel.speed + ' kts';
        if (hit.vessel.catch && hit.vessel.catch !== '—') {
          parts += ' · ' + hit.vessel.catch;
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

      highlightRosterItem(rosterScope, hit.index);
      mapEl.style.cursor = 'pointer';

      if (typeof config.onVesselHover === 'function') {
        config.onVesselHover(hit.vessel, { x: mx, y: my });
      }
    } else {
      // Check port hover
      var portHit = hitTestPort(config.ports, config._projFn, mx, my);

      if (portHit) {
        mapEl.style.cursor = 'pointer';
      } else {
        mapEl.style.cursor = '';
      }

      // No vessel hit — hide tooltip and clear roster highlight
      if (tooltip) tooltip.classList.remove('active');
      clearRosterHighlight(rosterScope);
    }
  }

  // ---- Mouseleave ----
  function onMouseleave() {
    if (tooltip) tooltip.classList.remove('active');
    clearRosterHighlight(rosterScope);
    mapEl.style.cursor = '';
  }

  // ---- Click ----
  function onClick(e) {
    var rect = mapEl.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    // Vessel click — expand detail panel
    var vesselHit = hitTestVessel(vessels, mx, my);
    if (vesselHit) {
      if (typeof config.onVesselClick === 'function') {
        config.onVesselClick(vesselHit.vessel, { x: mx, y: my });
      }
      return;
    }

    // Port click — expand port panel
    var portHit = hitTestPort(config.ports, config._projFn, mx, my);
    if (portHit) {
      if (typeof config.onPortClick === 'function') {
        config.onPortClick(portHit.port, portHit.screenPos);
      }
      return;
    }

    // Click on empty area — dismiss panels
    if (typeof config.onMapClick === 'function') {
      config.onMapClick({ x: mx, y: my });
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
