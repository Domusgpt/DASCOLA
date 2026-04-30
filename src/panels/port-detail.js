/**
 * Port Detail Panel
 * ==================
 * Expandable overlay panel for port information. Appears when a port
 * marker is clicked on the map. Shows berth status, tidal data,
 * available services, and VHF channels.
 */

export function createPortDetailPanel(container) {
  var existing = container.querySelector('.port-detail-panel');
  if (existing) return existing;

  var panel = document.createElement('div');
  panel.className = 'port-detail-panel';
  panel.innerHTML = [
    '<div class="pdp-header">',
    '  <div class="pdp-close">&times;</div>',
    '  <h3 class="pdp-name"></h3>',
    '  <div class="pdp-size"></div>',
    '</div>',
    '<div class="pdp-body">',
    '  <div class="pdp-section">',
    '    <div class="pdp-section-title">TIDAL DATA</div>',
    '    <div class="pdp-grid">',
    '      <div class="pdp-field"><span class="pdp-label">HEIGHT</span><span class="pdp-value pdp-tide-h"></span></div>',
    '      <div class="pdp-field"><span class="pdp-label">STATE</span><span class="pdp-value pdp-tide-state"></span></div>',
    '      <div class="pdp-field"><span class="pdp-label">NEXT HIGH</span><span class="pdp-value pdp-next-high"></span></div>',
    '      <div class="pdp-field"><span class="pdp-label">NEXT LOW</span><span class="pdp-value pdp-next-low"></span></div>',
    '    </div>',
    '    <div class="pdp-tide-bar">',
    '      <div class="pdp-tide-fill"></div>',
    '      <div class="pdp-tide-marker"></div>',
    '    </div>',
    '  </div>',
    '  <div class="pdp-section">',
    '    <div class="pdp-section-title">BERTH STATUS</div>',
    '    <div class="pdp-grid">',
    '      <div class="pdp-field"><span class="pdp-label">TOTAL</span><span class="pdp-value pdp-berth-total"></span></div>',
    '      <div class="pdp-field"><span class="pdp-label">AVAILABLE</span><span class="pdp-value pdp-berth-avail"></span></div>',
    '    </div>',
    '    <div class="pdp-berth-row"></div>',
    '    <div class="pdp-restrictions"></div>',
    '  </div>',
    '  <div class="pdp-section">',
    '    <div class="pdp-section-title">SERVICES</div>',
    '    <div class="pdp-services"></div>',
    '  </div>',
    '  <div class="pdp-section">',
    '    <div class="pdp-section-title">COMMUNICATIONS</div>',
    '    <div class="pdp-grid">',
    '      <div class="pdp-field"><span class="pdp-label">VHF</span><span class="pdp-value pdp-vhf"></span></div>',
    '      <div class="pdp-field"><span class="pdp-label">UPDATED</span><span class="pdp-value pdp-updated"></span></div>',
    '    </div>',
    '  </div>',
    '  <div class="pdp-coords">',
    '    <span class="pdp-lat"></span> / <span class="pdp-lon"></span>',
    '  </div>',
    '</div>',
  ].join('\n');

  container.appendChild(panel);

  panel.querySelector('.pdp-close').addEventListener('click', function() {
    hidePortDetail(panel);
  });

  return panel;
}

export function showPortDetail(panel, port, portData, screenPos) {
  if (!panel || !port) return;

  panel.querySelector('.pdp-name').textContent = port.name;
  panel.querySelector('.pdp-size').textContent = (port.size === 'major' ? 'Major Port' : 'Minor Port');

  // Coordinates
  panel.querySelector('.pdp-lat').textContent = _fmtCoord(port.lat, 'NS');
  panel.querySelector('.pdp-lon').textContent = _fmtCoord(port.lon, 'EW');

  if (portData) {
    // Tidal data
    panel.querySelector('.pdp-tide-h').textContent = portData.tideHeight + ' m';
    panel.querySelector('.pdp-tide-state').textContent = portData.tideState;
    panel.querySelector('.pdp-next-high').textContent = _fmtTime(portData.nextHighTide);
    panel.querySelector('.pdp-next-low').textContent = _fmtTime(portData.nextLowTide);

    // Tide bar visualization
    var tidePct = Math.max(0, Math.min(100, (portData.tideHeight / 3.5) * 100));
    var tideFill = panel.querySelector('.pdp-tide-fill');
    var tideMarker = panel.querySelector('.pdp-tide-marker');
    if (tideFill) tideFill.style.width = tidePct + '%';
    if (tideMarker) tideMarker.style.left = tidePct + '%';

    // Berths
    panel.querySelector('.pdp-berth-total').textContent = portData.totalBerths;
    panel.querySelector('.pdp-berth-avail').textContent = portData.availableBerths;

    var berthRow = panel.querySelector('.pdp-berth-row');
    berthRow.innerHTML = '';
    for (var b = 0; b < portData.totalBerths; b++) {
      var dot = document.createElement('span');
      dot.className = 'pdp-berth-dot' + (b < portData.occupiedBerths ? ' occupied' : '');
      berthRow.appendChild(dot);
    }

    // Restrictions
    var restEl = panel.querySelector('.pdp-restrictions');
    restEl.textContent = portData.restrictions || '';
    restEl.className = 'pdp-restrictions' + (portData.restrictions && portData.restrictions !== 'Open' ? ' pdp-restricted' : '');

    // Services
    var services = panel.querySelector('.pdp-services');
    services.innerHTML = '';
    _addService(services, 'Fuel', portData.fuelAvailable);
    _addService(services, 'Ice', portData.iceAvailable);
    _addService(services, 'Repair', port.size === 'major');
    _addService(services, 'Provisions', port.size === 'major');

    // Comms
    panel.querySelector('.pdp-vhf').textContent = portData.harbormaster || 'Ch. 16';
    panel.querySelector('.pdp-updated').textContent = _fmtTime(portData.lastUpdated);
  } else {
    panel.querySelector('.pdp-tide-h').textContent = '—';
    panel.querySelector('.pdp-tide-state').textContent = '—';
    panel.querySelector('.pdp-next-high').textContent = '—';
    panel.querySelector('.pdp-next-low').textContent = '—';
    panel.querySelector('.pdp-berth-total').textContent = '—';
    panel.querySelector('.pdp-berth-avail').textContent = '—';
    panel.querySelector('.pdp-berth-row').innerHTML = '';
    panel.querySelector('.pdp-restrictions').textContent = '';
    panel.querySelector('.pdp-services').innerHTML = '<span class="pdp-no-data">No live data</span>';
    panel.querySelector('.pdp-vhf').textContent = 'Ch. 16';
    panel.querySelector('.pdp-updated').textContent = '—';
  }

  // Position panel
  var mapEl = panel.closest('.fleet-map');
  if (mapEl && screenPos) {
    var mapRect = mapEl.getBoundingClientRect();
    var panelW = 260;
    var px = screenPos.x + 20;
    if (px + panelW > mapRect.width) px = screenPos.x - panelW - 20;
    if (px < 8) px = 8;
    panel.style.left = px + 'px';
    panel.style.top = '8px';
  }

  panel.classList.add('active');
}

export function hidePortDetail(panel) {
  if (panel) panel.classList.remove('active');
}

function _fmtCoord(val, dirs) {
  var abs = Math.abs(val);
  var deg = Math.floor(abs);
  var min = ((abs - deg) * 60).toFixed(1);
  return deg + '°' + min + "'" + (val >= 0 ? dirs[0] : dirs[1]);
}

function _fmtTime(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch(e) { return '—'; }
}

function _addService(container, name, available) {
  var el = document.createElement('span');
  el.className = 'pdp-service' + (available ? ' available' : ' unavailable');
  el.textContent = name;
  container.appendChild(el);
}
